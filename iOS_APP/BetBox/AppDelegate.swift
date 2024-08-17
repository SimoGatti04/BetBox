//
//  AppDelegate.swift
//  BetBox
//
//  Created by Aurora Bellini on 15/08/24.
//


import UIKit
import BackgroundTasks

class AppDelegate: UIResponder, UIApplicationDelegate {
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

