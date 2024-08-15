import SwiftUI
import Combine

import SwiftUI
import Combine

class BalanceManager: NSObject, ObservableObject {
    @Published var balances: [String: String] = [:]
    @Published var showingVerificationPopup = false
    @Published var verificationSite = ""
    @Published var verificationCode = ""
    
    static let shared = BalanceManager()
    private var cancellables = Set<AnyCancellable>()
    var backgroundCompletionHandler: (() -> Void)?
    
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "simogatti.BetBox.balancebackgroundsession")
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private let baseReconnectDelay: TimeInterval = 1.0
    
    private override init() {
        super.init()
        loadSavedBalances()
        connectWebSocket()
    }
    
    func loadSavedBalances() {
        if let data = try? Data(contentsOf: getBalancesFileURL()),
           let savedBalances = try? JSONDecoder().decode([String: String].self, from: data) {
            balances = savedBalances
        }
    }
    
    func saveBalances() {
        if let data = try? JSONEncoder().encode(balances) {
            try? data.write(to: getBalancesFileURL())
        }
        NotificationCenter.default.post(name: Notification.Name("BalancesUpdated"), object: nil)
    }
    
    func updateBalance(for site: String, balance: String) {
        balances[site.lowercased()] = balance
        saveBalances()
    }
    
    private func getBalancesFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("balances.json")
    }
    
    func loadBalance(for site: String, progressUpdate: @escaping (Double) -> Void) {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/balances/\(site)"
        guard let url = URL(string: urlString) else { return }
        
        let task = backgroundSession.dataTask(with: url)
        
        let progress = Progress(totalUnitCount: 100)
        progress.publisher(for: \.fractionCompleted)
            .sink { fraction in
                progressUpdate(fraction)
            }
            .store(in: &cancellables)
        
        task.resume()
        
        Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { timer in
            if progress.fractionCompleted < 0.9 {
                progress.completedUnitCount += 10
            } else if task.state == .completed {
                progress.completedUnitCount = 100
                timer.invalidate()
            }
        }
    }
    
    func loadAllBalances() {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/balances/all"
        guard let url = URL(string: urlString) else { return }
        
        let task = backgroundSession.dataTask(with: url)
        task.resume()
    }
    
    func submitVerificationCode(site: String, code: String) {
        let urlString = "https://legally-modest-joey.ngrok-free.app/verify/\(site)"
        guard let url = URL(string: urlString) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: String] = ["verificationCode": code]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        let task = backgroundSession.dataTask(with: request)
        task.resume()
    }
    
    func connectWebSocket() {
        guard let url = URL(string: "wss://legally-modest-joey.ngrok-free.app") else { return }
        webSocketTask = URLSession.shared.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
    }

    func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                self.handleReceivedMessage(message)
                self.reconnectAttempts = 0
                self.scheduleNextReceive()
            case .failure(let error):
                print("WebSocket error: \(error)")
                self.handleReconnect()
            }
        }
    }
    
    func scheduleNextReceive() {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                self?.receiveMessage()
            }
        }
    
    func handleReceivedMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            print("Received string message: \(text)")
            if let data = text.data(using: .utf8) {
                do {
                    if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
                        if let type = json["type"] as? String {
                           print("Received message type: \(type)")
                           switch type {
                           case "VERIFICATION_REQUIRED":
                               if let site = json["site"] as? String {
                                   print("Verification required for site: \(site)")
                                   DispatchQueue.main.async {
                                       self.verificationSite = site
                                       self.showingVerificationPopup = true
                                       print("Set showingVerificationPopup to true")
                                   }
                               }
                            case "BALANCE_UPDATE":
                                if let site = json["site"] as? String, let balance = json["balance"] as? String {
                                    DispatchQueue.main.async {
                                        self.updateBalance(for: site, balance: balance)
                                    }
                                }
                            default:
                                print("Received unknown message type: \(type)")
                            }
                        }
                    }
                } catch {
                    print("Error parsing JSON: \(error)")
                }
            }
        case .data(let data):
            print("Received binary message: \(data)")
            // Implementa qui la logica per gestire i messaggi binari se necessario
        @unknown default:
            print("Received unknown message type")
        }
    }


    
    func handleReconnect() {
        guard reconnectAttempts < maxReconnectAttempts else {
            print("Raggiunto il numero massimo di tentativi di riconnessione")
            return
        }

        let delay = baseReconnectDelay * pow(2.0, Double(reconnectAttempts))
        reconnectAttempts += 1
        
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) { [weak self] in
            print("Tentativo di riconnessione WebSocket: \(self?.reconnectAttempts ?? 0)")
            self?.connectWebSocket()
        }
    }
}

extension BalanceManager: URLSessionDelegate, URLSessionDataDelegate {
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        do {
            if let httpResponse = dataTask.response as? HTTPURLResponse, httpResponse.statusCode == 202 {
                let verificationInfo = try JSONDecoder().decode(VerificationInfo.self, from: data)
                print("Ricevuta richiesta di verifica per: \(verificationInfo.site)")
                DispatchQueue.main.async {
                    self.verificationSite = verificationInfo.site
                    self.showingVerificationPopup = true
                }
            } else if let site = dataTask.originalRequest?.url?.lastPathComponent, site != "all" {
                let balance = try JSONDecoder().decode(Balance.self, from: data)
                DispatchQueue.main.async {
                    self.updateBalance(for: balance.site, balance: balance.balance)
                }
            } else {
                let balances = try JSONDecoder().decode([Balance].self, from: data)
                DispatchQueue.main.async {
                    for balance in balances {
                        self.updateBalance(for: balance.site, balance: balance.balance)
                    }
                }
            }
        } catch {
            print("Errore nella decodifica dei dati del saldo: \(error)")
        }
    }
    
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("Errore nella richiesta del saldo: \(error)")
        }
        DispatchQueue.main.async {
            LogManager.shared.finishAPIRequest()
        }
    }
    
    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            self.backgroundCompletionHandler?()
        }
    }
}


struct BalanceView: View {
    @StateObject private var balanceManager = BalanceManager.shared
    @State private var isLoading = false
    @State private var progress: [String: Double] = [:]
    
    let sites = ["goldbet", "bet365", "eurobet", "sisal", "snai", "lottomatica", "cplay"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteBalanceView(
                            site: site,
                            balance: balanceManager.balances[site.lowercased()] ?? "N/A",
                            action: {
                                balanceManager.loadBalance(for: site) { newProgress in
                                    progress[site] = newProgress
                                }
                            },
                            isLoading: Binding(
                                get: { progress[site, default: 0] > 0 && progress[site, default: 0] < 1 },
                                set: { _ in }
                            ),
                            progress: Binding(
                                get: { progress[site, default: 0] },
                                set: { progress[site] = $0 }
                            )
                        )
                    }
                }
                .padding()
            }
            .navigationTitle("Saldi")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        balanceManager.loadAllBalances()
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
        }
        .onAppear(perform: balanceManager.loadSavedBalances)
        .sheet(isPresented: $balanceManager.showingVerificationPopup) {
            VerificationPopupView(
                isPresented: $balanceManager.showingVerificationPopup,
                verificationCode: $balanceManager.verificationCode,
                site: balanceManager.verificationSite,
                onSubmit: { code in
                    balanceManager.submitVerificationCode(site: balanceManager.verificationSite, code: code)
                }
            )
        }
    }
}

struct CircularProgressButton: View {
    let action: () -> Void
    @Binding var isLoading: Bool
    @Binding var progress: Double
    @State private var isCompleted = false
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(lineWidth: 2)
                .opacity(0.3)
                .foregroundColor(.blue)
            
            Circle()
                .trim(from: 0.0, to: CGFloat(isCompleted ? 1 : progress))
                .stroke(style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round))
                .foregroundColor(.blue)
                .rotationEffect(Angle(degrees: 270.0))
                .animation(.linear, value: progress)
            
            Button(action: {
                isLoading = true
                progress = 0
                isCompleted = false
                action()
            }) {
                Image(systemName: "arrow.clockwise")
                    .foregroundColor(.blue)
                    .rotationEffect(Angle(degrees: isLoading ? 360 : 0))
                    .animation(isLoading ? Animation.linear(duration: 1).repeatForever(autoreverses: false) : .default, value: isLoading)
            }
            .disabled(isLoading)
        }
        .frame(width: 30, height: 30)
        .onChange(of: progress) { newValue in
            if newValue >= 1.0 {
                isCompleted = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                    isCompleted = false
                    progress = 0
                    isLoading = false
                }
            }
        }
    }
}

struct SiteBalanceView: View {
    let site: String
    let balance: String
    let action: () -> Void
    @Binding var isLoading: Bool
    @Binding var progress: Double
    
    var body: some View {
        VStack {
            HStack {
                Image(site.lowercased())
                    .resizable()
                    .scaledToFit()
                    .frame(width: 50, height: 50)
                Spacer()
                CircularProgressButton(action: action, isLoading: $isLoading, progress: $progress)
            }
            Text(balance)
                .font(.headline)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
    }
}

struct VerificationPopupView: View {
    @Binding var isPresented: Bool
    @Binding var verificationCode: String
    let site: String
    let onSubmit: (String) -> Void

    var body: some View {
        VStack {
            Text("Verifica richiesta per \(site)")
                .font(.headline)
            TextField("Inserisci il codice", text: $verificationCode)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .padding()
            Button("Invia") {
                onSubmit(verificationCode)
                isPresented = false
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(10)
        .shadow(radius: 10)
    }
}

struct VerificationInfo: Codable {
    let message: String
    let site: String
    let verificationType: String?
}

struct Balance: Codable {
    let site: String
    let balance: String
}
