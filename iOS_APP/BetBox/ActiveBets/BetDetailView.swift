//
//  BetDetailView.swift
//  BetBox
//
//  Created by Aurora Bellini on 18/07/24.
//

import SwiftUI

struct BetDetailView: View {
    let bet: Bet

    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Image(bet.siteName)
                    .resizable()
                    .frame(width: 70, height: 70)
                    .clipShape(Circle())
                Spacer()
            }
            .padding(.bottom, 10)
            Text("ID: \(bet.id)")
            Text("Total Odds: \(bet.totalOdds, specifier: "%.2f")")
            Text("Amount Bet: \(bet.amountBet, specifier: "%.2f")")
            Text("Potential Winnings: \(bet.potentialWinnings, specifier: "%.2f")")
            ForEach(bet.events) { event in
                HStack {
                    OutcomeIndicator(outcome: event.outcome)
                    Text(event.name)
                    Spacer()
                    Text("\(event.odds, specifier: "%.2f")")
                }
                .padding(.vertical, 5)
            }
        }
        .padding()
        .navigationTitle("Bet Details")
    }
}

struct BetDetailView_Previews: PreviewProvider {
    static var previews: some View {
        BetDetailView(bet: Bet(
            id: "1",
            siteName: "Snai",
            events: [
                Event(name: "Event 1", odds: 1.5, outcome: "In corso"),
                Event(name: "Event 2", odds: 2.0, outcome: "Vincente")
            ],
            totalOdds: 3.0,
            amountBet: 100.0,
            potentialWinnings: 300.0
        ))
    }
}



