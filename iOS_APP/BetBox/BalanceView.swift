import SwiftUI

struct BalanceView: View {
    @State private var balances: [Balance] = []

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
            .onAppear(perform: loadBalances)
        }
    }

    func loadBalances() {
        guard let url = URL(string: "https://b757-78-210-250-76.ngrok-free.app/balances/all") else {
            print("Invalid URL")
            return
        }

        URLSession.shared.dataTask(with: url) { data, response, error in
            if let error = error {
                print("Error: \(error.localizedDescription)")
                return
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
