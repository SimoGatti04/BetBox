import SwiftUI

class LogManager: ObservableObject {
    @Published var logText = ""
    private var webSocketTask: URLSessionWebSocketTask?
    static let shared = LogManager()
    private var isConnected = false

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
                self.riceviMessaggio()
            case .failure(let error):
                print("Errore nella ricezione del messaggio: \(error)")
                self.isConnected = false
                self.connetti()
            }
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
        // Implementazione della funzione finishAPIRequest
        // Qui puoi aggiungere eventuali operazioni di pulizia o chiusura
        print("Richiesta API completata")
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
