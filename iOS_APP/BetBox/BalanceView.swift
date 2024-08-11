import SwiftUI

class BalanceManager: ObservableObject {
    @Published var balances: [String: String] = [:]
    
    func loadSavedBalances() {
        if let savedBalances = UserDefaults.standard.dictionary(forKey: "balances") as? [String: String] {
            balances = savedBalances
        }
    }
    
    func saveBalances() {
        UserDefaults.standard.set(balances, forKey: "balances")
    }
}

struct BalanceView: View {
    @StateObject private var balanceManager = BalanceManager()
    @State private var isLoading = false
    
    let sites = ["goldbet", "bet365", "eurobet", "sisal", "snai", "lottomatica", "cplay"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteBalanceView(site: site, balance: balanceManager.balances[site.lowercased()] ?? "N/A") {
                            loadBalance(for: site)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Balances")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: loadAllBalances) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
        }
        .onAppear(perform: balanceManager.loadSavedBalances)
    }
    
    func loadAllBalances() {
        isLoading = true
        guard let url = URL(string: "https://legally-modest-joey.ngrok-free.app/balances/all") else {
            print("Invalid URL")
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            defer { isLoading = false }
            if let data = data {
                do {
                    let decodedBalances = try JSONDecoder().decode([Balance].self, from: data)
                    DispatchQueue.main.async {
                        for balance in decodedBalances {
                            balanceManager.balances[balance.site.lowercased()] = balance.balance
                        }
                        balanceManager.saveBalances()
                        NotificationCenter.default.post(name: Notification.Name("BalanceLoaded"), object: nil)
                    }
                } catch {
                    print("Errore di decodifica: \(error)")
                    if let dataString = String(data: data, encoding: .utf8) {
                        print("Dati ricevuti: \(dataString)")
                    }
                }
            }
        }.resume()
    }
    
    func loadBalance(for site: String) {
        guard let url = URL(string: "https://legally-modest-joey.ngrok-free.app/balances/\(site)") else {
            print("Invalid URL")
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let data = data {
                do {
                    let decodedBalance = try JSONDecoder().decode(Balance.self, from: data)
                    DispatchQueue.main.async {
                        balanceManager.balances[decodedBalance.site.lowercased()] = decodedBalance.balance
                        balanceManager.saveBalances()
                        print("Saldo aggiornato per \(decodedBalance.site): \(decodedBalance.balance)")
                        NotificationCenter.default.post(name: Notification.Name("BalanceLoaded"), object: nil)
                    }
                } catch {
                    print("Errore di decodifica: \(error)")
                    if let dataString = String(data: data, encoding: .utf8) {
                        print("Dati ricevuti: \(dataString)")
                    }
                }
            }
        }.resume()
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
        .onReceive(NotificationCenter.default.publisher(for: Notification.Name("BalanceLoaded"))) { _ in
            isLoading = false
        }
    }
}

struct Balance: Decodable {
    let site: String
    let balance: String
}

struct BalanceView_Previews: PreviewProvider {
    static var previews: some View {
        BalanceView()
    }
}
