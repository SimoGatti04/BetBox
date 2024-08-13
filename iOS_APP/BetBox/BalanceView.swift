import SwiftUI
import Combine

class BalanceManager: ObservableObject {
    @Published var balances: [String: String] = [:]
    static let shared = BalanceManager()
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        loadSavedBalances()
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
    
    func loadBalance(for site: String) {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/balances/\(site)"
        guard let url = URL(string: urlString) else { return }
        
        URLSession.shared.dataTaskPublisher(for: url)
            .retry(3)
            .map(\.data)
            .decode(type: Balance.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { completion in
                switch completion {
                case .finished:
                    break
                case .failure(let error):
                    print("Error loading balance for \(site): \(error)")
                }
                LogManager.shared.finishAPIRequest()
            }, receiveValue: { [weak self] balance in
                self?.updateBalance(for: balance.site, balance: balance.balance)
            })
            .store(in: &cancellables)
    }
    
    func loadAllBalances() {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/balances/all"
        guard let url = URL(string: urlString) else { return }
        
        URLSession.shared.dataTaskPublisher(for: url)
            .retry(3)
            .map(\.data)
            .decode(type: [Balance].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { completion in
                switch completion {
                case .finished:
                    break
                case .failure(let error):
                    print("Error loading all balances: \(error)")
                }
                LogManager.shared.finishAPIRequest()
            }, receiveValue: { [weak self] balances in
                for balance in balances {
                    self?.updateBalance(for: balance.site, balance: balance.balance)
                }
            })
            .store(in: &cancellables)
    }
}

struct BalanceView: View {
    @ObservedObject private var balanceManager = BalanceManager.shared
    @State private var isLoading = false
    
    let sites = ["goldbet", "bet365", "eurobet", "sisal", "snai", "lottomatica", "cplay"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteBalanceView(site: site, balance: balanceManager.balances[site.lowercased()] ?? "N/A") {
                            balanceManager.loadBalance(for: site)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Balances")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: balanceManager.loadAllBalances) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
        }
        .onAppear(perform: balanceManager.loadSavedBalances)
    }
}

struct SiteBalanceView: View {
    let site: String
    let balance: String
    let action: () -> Void
    @State private var isLoading = false
    
    var body: some View {
        VStack {
            HStack {
                Image(site.lowercased())
                    .resizable()
                    .scaledToFit()
                    .frame(width: 50, height: 50)
                Spacer()
                Button(action: {
                    isLoading = true
                    action()
                }) {
                    Image(systemName: "arrow.clockwise")
                }
                .disabled(isLoading)
            }
            Text(balance)
                .font(.headline)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("BalancesUpdated"))) { _ in
            isLoading = false
        }
    }
}

struct Balance: Codable {
    let site: String
    let balance: String
}
