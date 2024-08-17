//
//  AppDelegate.swift
//  BetBox
//
//  Created by Aurora Bellini on 15/08/24.
//


import UIKit
import BackgroundTasks

class AppDelegate: UIResponder, UIApplicationDelegate {
    func applicationDidBecomeActive(_ application: UIApplication) {
        SpinManager.shared.appDidBecomeActive()
    }

    func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
        SpinManager.shared.backgroundCompletionHandler = completionHandler
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "simogatti.BetBox.spinautomation", using: nil) { task in
            SpinManager.shared.handleBackgroundTask(task: task as! BGAppRefreshTask)
        }
        return true
    }

    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "simogatti.BetBox.spinautomation", using: nil) { task in
            SpinManager.shared.handleBackgroundTask(task: task as! BGAppRefreshTask)
        }
    }
    func handleSpinAutomation(task: BGAppRefreshTask) {
        scheduleSpinAutomation()
        task.expirationHandler = {
            task.setTaskCompleted(success: false)
        }
        SpinManager.shared.checkAndPerformAutomations()
        task.setTaskCompleted(success: true)
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

