//
//  ActiveBetsView.swift
//  BetBox
//
//  Created by Aurora Bellini on 18/07/24.
//

import SwiftUI
    
struct Event: Identifiable, Decodable {
    let id = UUID()
    let name: String
    let odds: Double
    let outcome: String // "Vincente", "Perdente" o "In corso"
}

struct ActiveBetsView: View {
    @State private var activeBets: [Bet] = []

    var body: some View {
        NavigationView {
            List(activeBets) { bet in
                NavigationLink(destination: BetDetailView(bet: bet)) {
                    HStack {
                        Image(bet.siteName)
                            .resizable()
                            .frame(width: 30, height: 30)
                            .clipShape(Circle())
                        VStack(alignment: .leading) {
                            Text("Amount Bet: \(bet.amountBet, specifier: "%.2f")")
                            Text("Potential Winnings: \(bet.potentialWinnings, specifier: "%.2f")")
                        }
                    }
                }
            }
            .navigationTitle("Active Bets")
            .onAppear(perform: loadActiveBets)
        }
    }

    func loadActiveBets() {
        // Simulazione di caricamento dati
        self.activeBets = [
            Bet(
                id: "1",
                siteName: "Goldbet",
                events: [
                    Event(name: "Event 1", odds: 1.5, outcome: "In corso"),
                    Event(name: "Event 2", odds: 2.0, outcome: "Vincente")
                ],
                totalOdds: 3.0,
                amountBet: 100.0,
                potentialWinnings: 300.0
            ),
            Bet(
                id: "2",
                siteName: "Bet365",
                events: [
                    Event(name: "Event 3", odds: 1.8, outcome: "Perdente"),
                    Event(name: "Event 4", odds: 1.6, outcome: "In corso")
                ],
                totalOdds: 2.88,
                amountBet: 50.0,
                potentialWinnings: 144.0
            )
        ]
    }
}

struct ActiveBetsView_Previews: PreviewProvider {
    static var previews: some View {
        ActiveBetsView()
    }
}




struct Bet: Identifiable, Decodable {
    let id: String
    let siteName: String
    let events: [Event]
    let totalOdds: Double
    let amountBet: Double
    let potentialWinnings: Double
}


