//
//  BetBoxApp.swift
//  BetBox
//
//  Created by Aurora Bellini on 18/07/24.
//

import SwiftUI
import UIKit

@main
struct BetBoxApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

