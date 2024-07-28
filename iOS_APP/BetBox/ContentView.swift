//
//  ContentView.swift
//  BetBox
//
//  Created by Aurora Bellini on 18/07/24.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            BalanceView()
                .tabItem {
                    Label("Balances", systemImage: "dollarsign.circle")
                }
            
            ActiveBetsView()
                .tabItem {
                    Label("Active Bets", systemImage: "list.bullet")
                }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}



