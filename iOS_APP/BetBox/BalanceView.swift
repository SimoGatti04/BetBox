import SwiftUI

struct BalanceView: View {
    @State private var balances: [Balance] = []
    @State private var isLoading = false

    var body: some View {
        NavigationView {
            List(balances) { balance in
                HStack {
                    Text(balance.site)
                    Spacer()
                    Text(balance.balance)
                }
            }
            .navigationTitle("Balances")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        isLoading = true
                        loadBalances()
                    }) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(isLoading)
                }
            }
            .onAppear(perform: loadBalances)
        }
    }

    func loadBalances() {
        guard let url = URL(string: "https://a40a-78-210-250-76.ngrok-free.app/balances/goldbet") else {
            print("Invalid URL")
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let data = data {
                if let decodedBalances = try? JSONDecoder().decode([Balance].self, from: data) {
                    DispatchQueue.main.async {
                        self.balances = decodedBalances
                        self.isLoading = false
                    }
                    return
                }
            }
            
            guard let data = data else {
                print("No data received")
                return
            }
            
            do {
                let decodedBalances = try JSONDecoder().decode([Balance].self, from: data)
                DispatchQueue.main.async {
                    self.balances = decodedBalances
                }
            } catch {
                print("Decoding error: \(error)")
            }
        }.resume()
    }
}

struct Balance: Identifiable, Decodable {
    let id = UUID()
    let site: String
    let balance: String
    
    enum CodingKeys: String, CodingKey {
        case site, balance
    }
}

struct BalanceView_Previews: PreviewProvider {
    static var previews: some View {
        BalanceView()
    }
}
