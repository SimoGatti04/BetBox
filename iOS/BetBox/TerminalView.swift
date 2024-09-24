import SwiftUI

class LogManager: ObservableObject {
    @Published var logText = ""
    private var webSocketTask: URLSessionWebSocketTask?
    static let shared = LogManager()
    private var isConnected = false
    private var reconnectTimer: Timer?

    init() {
        connetti()
    }

    private func connetti() {
        guard !isConnected else { return }
        let url = URL(string: "wss://legally-modest-joey.ngrok-free.app")!
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        riceviMessaggio()
    }

    private func riceviMessaggio() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    DispatchQueue.main.async {
                        self.logText += text + "\n"
                    }
                case .data(_):
                    break
                @unknown default:
                    break
                }
                // Pianifica la prossima ricezione con un breve ritardo
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    self.riceviMessaggio()
                }
            case .failure(let error):
                print("Errore nella ricezione del messaggio: \(error)")
                self.isConnected = false
                self.pianificaRiconnessione()
            }
        }
    }

    private func pianificaRiconnessione() {
        reconnectTimer?.invalidate()
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: false) { [weak self] _ in
            self?.connetti()
        }
    }

    func pulisciLog() {
        logText = ""
    }

    func prepareForAPIRequest() {
        pulisciLog()
        connetti()
    }

    func finishAPIRequest() {
        DispatchQueue.main.async {
            self.logText += "Richiesta API completata\n"
        }
    }

    deinit {
        reconnectTimer?.invalidate()
        webSocketTask?.cancel()
    }
}

struct TerminalView: View {
    @ObservedObject private var logManager = LogManager.shared

    var body: some View {
        VStack {
            Text("Terminale")
                .font(.largeTitle)
                .padding()

            ScrollViewReader { proxy in
                ScrollView {
                    Text(logManager.logText)
                        .font(.system(.body, design: .monospaced))
                        .padding()
                        .id("logBottom")
                }
                .onChange(of: logManager.logText) { _ in
                    withAnimation {
                        proxy.scrollTo("logBottom", anchor: .bottom)
                    }
                }
            }
        }
    }
}
