//
//  BalanceView.swift
//  BetBox
//
//  Created by Aurora Bellini on 18/07/24.
//

import SwiftUI

struct BalanceView: View {
    @State private var balances: [Balance] = []

    var body: some View {
        NavigationView {
            List(balances) { balance in
                HStack {
                    Text(balance.siteName)
                    Spacer()
                    Text("\(balance.amount, specifier: "%.2f")")
                }
            }
            .navigationTitle("Balances")
            .onAppear(perform: loadBalances)
        }
    }

    func loadBalances() {
        guard let url = URL(string: "https://tuo-server.com/balances") else {
            print("Invalid URL")
            return
        }

        let task = URLSession.shared.dataTask(with: url) { data, response, error in
            if let data = data {
                if let decodedBalances = try? JSONDecoder().decode([Balance].self, from: data) {
                    DispatchQueue.main.async {
                        self.balances = decodedBalances
                    }
                    return
                }
            }

            print("Fetch failed: \(error?.localizedDescription ?? "Unknown error")")
        }

        task.resume()
    }
}

struct Balance: Identifiable, Decodable {
    let id = UUID()
    let siteName: String
    let amount: Double
}

struct BalanceView_Previews: PreviewProvider {
    static var previews: some View {
        BalanceView()
    }
}
