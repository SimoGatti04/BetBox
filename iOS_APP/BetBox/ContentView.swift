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

            SpinView()
                .tabItem {
                    Image(systemName: "arrow.2.circlepath")
                    Text("Spin")
                }
                
            TerminalView()
                .tabItem {
                Image(systemName: "terminal")
                Text("Terminale")
                }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}



