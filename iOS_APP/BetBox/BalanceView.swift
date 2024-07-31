import SwiftUI

struct BalanceView: View {
    @State private var balances: [String: String] = [:]
    @State private var isLoading = false
    
    let sites = ["goldbet", "bet365", "eurobet", "sisal", "snai", "lottomatica", "cplay"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteBalanceView(site: site, balance: balances[site] ?? "N/A") {
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
        .onAppear(perform: loadSavedBalances)
    }
    
    func loadSavedBalances() {
        if let savedBalances = UserDefaults.standard.dictionary(forKey: "balances") as? [String: String] {
            balances = savedBalances
        }
    }
    
    func saveBalances() {
        UserDefaults.standard.set(balances, forKey: "balances")
    }
    
    func loadAllBalances() {
        isLoading = true
        guard let url = URL(string: "https://a40a-78-210-250-76.ngrok-free.app/balances/all") else {
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
                            balances[balance.site] = balance.balance
                        }
                        saveBalances()
                    }
                } catch {
                    print("Decoding error: \(error)")
                }
            }
        }.resume()
    }
    
    func loadBalance(for site: String) {
        guard let url = URL(string: "https://a40a-78-210-250-76.ngrok-free.app/balances/\(site)") else {
            print("Invalid URL")
            return
        }
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            if let data = data {
                do {
                    let decodedBalance = try JSONDecoder().decode(Balance.self, from: data)
                    DispatchQueue.main.async {
                        balances[decodedBalance.site] = decodedBalance.balance
                        saveBalances()
                    }
                } catch {
                    print("Decoding error: \(error)")
                }
            }
        }.resume()
    }
}

struct SiteBalanceView: View {
    let site: String
    let balance: String
    let action: () -> Void
    
    var body: some View {
        VStack {
            HStack {
                Image(site.lowercased())
                    .resizable()
                    .scaledToFit()
                    .frame(width: 50, height: 50)
                Spacer()
                Button(action: action) {
                    Image(systemName: "arrow.clockwise")
                }
            }
            Text(balance)
                .font(.headline)
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
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
