//
//  OutcomeIndicator.swift
//  BetBox
//
//  Created by Aurora Bellini on 18/07/24.
//

import SwiftUI

struct OutcomeIndicator: View {
    let outcome: String

    var body: some View {
        Circle()
            .fill(color(for: outcome))
            .frame(width: 10, height: 10)
    }

    func color(for outcome: String) -> Color {
        switch outcome {
        case "Vincente":
            return .green
        case "Perdente":
            return .red
        case "In corso":
            return .gray
        default:
            return .black
        }
    }
}

struct OutcomeIndicator_Previews: PreviewProvider {
    static var previews: some View {
        OutcomeIndicator(outcome: "Vincente")
    }
}

