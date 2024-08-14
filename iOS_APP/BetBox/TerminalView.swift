import SwiftUI

class LogManager: ObservableObject {
    @Published var logText = ""
    private var webSocketTask: URLSessionWebSocketTask?
    static let shared = LogManager()
    private var isConnected = false

    func connect() {
        guard !isConnected else { return }
        let url = URL(string: "wss://legally-modest-joey.ngrok-free.app/logs")!
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        isConnected = true
        receiveMessage()
    }

    func disconnect() {
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        isConnected = false
    }

    private func receiveMessage() {
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
                if self.isConnected {
                    self.receiveMessage()
                }
            case .failure(let error):
                print("Error receiving message: \(error)")
                self.isConnected = false
            }
        }
    }

    func clearLog() {
        logText = ""
    }

    func prepareForAPIRequest() {
        clearLog()
        connect()
    }

    func finishAPIRequest() {
        disconnect()
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

