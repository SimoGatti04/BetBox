//
//  AppDelegate.swift
//  BetBox
//
//  Created by Aurora Bellini on 15/08/24.
//


import UIKit
import BackgroundTasks

class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
        SpinManager.shared.backgroundCompletionHandler = completionHandler
        if identifier == "simogatti.BetBox.balancebackgroundsession" {
            BalanceManager.shared.backgroundCompletionHandler = completionHandler
        }
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        registerBackgroundTasks()
        return true
    }

    func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "simogatti.BetBox.spinautomation", using: nil) { task in
            self.handleSpinAutomation(task: task as! BGAppRefreshTask)
        }
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "simogatti.BetBox.spinprocessing", using: nil) { task in
            self.handleSpinProcessing(task: task as! BGProcessingTask)
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
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            print("Impossibile programmare l'automazione degli spin: \(error)")
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

