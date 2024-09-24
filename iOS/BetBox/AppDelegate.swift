//
//  AppDelegate.swift
//  BetBox
//
//  Created by Aurora Bellini on 15/08/24.
//


import UIKit
import BackgroundTasks

class AppDelegate: UIResponder, UIApplicationDelegate {
    var backgroundCompletionHandler: (() -> Void)?
    func updateBalance(for site: String, balance: String) {
        func updateBalance(for site: String, balance: String) {
            DispatchQueue.main.async {
                BalanceManager.shared.updateBalance(for: site, balance: balance)
            }
        }
    }
    
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        do {
            let balance = try JSONDecoder().decode(Balance.self, from: data)
            DispatchQueue.main.async {
                self.updateBalance(for: balance.site, balance: balance.balance)
            }
        } catch {
            print("Errore nella decodifica del saldo: \(error)")
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("Errore nella richiesta del saldo: \(error)")
        }
        DispatchQueue.main.async {
            LogManager.shared.finishAPIRequest()
        }
    }

    func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
        DispatchQueue.main.async {
            self.backgroundCompletionHandler?()
        }
    }

    func handleSpinProcessing(task: BGProcessingTask) {
        scheduleSpinProcessing()
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        SpinManager.shared.processBackgroundTasks {
            task.setTaskCompleted(success: true)
        }
    }

    func scheduleSpinAutomation() {
        let request = BGAppRefreshTaskRequest(identifier: "simogatti.BetBox.spinautomation")
        request.earliestBeginDate = Date(timeIntervalSinceNow: 60) // Esegui ogni minuto
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Errore nella programmazione: \(error)")
        }
    }


    func scheduleSpinProcessing() {
        let request = BGProcessingTaskRequest(identifier: "simogatti.BetBox.spinprocessing")
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Impossibile programmare l'elaborazione degli spin: \(error)")
        }
    }
}

