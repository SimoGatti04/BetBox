import SwiftUI
import Combine
import UserNotifications
import BackgroundTasks

struct SpinAutomation: Codable, Identifiable {
    let id = UUID()
    let site: String
    let time: Date
    var isEnabled: Bool
}

struct SpinView: View {
    @ObservedObject private var spinManager = SpinManager.shared
    @State private var showingAutomationView = false
    
    let sites = ["goldbet", "lottomatica", "snai"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteSpinView(site: site, spinStatus: spinManager.isSpinPerformedToday(for: site), lastBonus: spinManager.getLastBonus(for: site), bonusHistory: spinManager.bonusHistory[site] ?? []) {
                            spinManager.performSpin(for: site)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Spin")
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: {
                        showingAutomationView = true
                    }) {
                        Image(systemName: "clock")
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: spinManager.checkAllSpinStatus) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .sheet(isPresented: $showingAutomationView) {
            AutomationView()
        }
        .onAppear(perform: spinManager.loadSavedData)
    }
}

struct SiteSpinView: View {
    let site: String
    let spinStatus: Bool
    let lastBonus: BonusInfo?
    let bonusHistory: [BonusInfo]
    let action: () -> Void
    @State private var showingBonusHistory = false
    
    var body: some View {
        VStack {
            HStack {
                Image(site.lowercased())
                    .resizable()
                    .scaledToFit()
                    .frame(width: 50, height: 50)
                
                Spacer()
                
                if let bonus = lastBonus {
                    VStack(alignment: .leading) {
                        Text("Ultimo bonus:")
                        Text("\(bonus.tipo): \(bonus.valore)")
                    }
                } else {
                    Text("Nessun bonus")
                }
                
                Spacer()
                
                Button(action: action) {
                    Image(systemName: "arrow.2.circlepath")
                        .font(.system(size: 30))
                }
            }
            
            Button("Visualizza log bonus") {
                showingBonusHistory = true
            }
            .padding(.top)
        }
        .padding()
        .background(spinStatus ? Color.green.opacity(0.2) : Color.gray.opacity(0.1))
        .cornerRadius(10)
        .sheet(isPresented: $showingBonusHistory) {
            BonusHistoryView(bonusHistory: bonusHistory, site: site)
        }
    }
}

struct BonusHistoryView: View {
    let bonusHistory: [BonusInfo]
    let site: String
    @ObservedObject private var spinManager = SpinManager.shared
    @State private var showingDeleteConfirmation = false
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        VStack {
            List(bonusHistory) { bonus in
                VStack(alignment: .leading) {
                    Text("Tipo: \(bonus.tipo)")
                    Text("Valore: \(bonus.valore)")
                    Text("Data: \(bonus.date, formatter: itemFormatter)")
                }
            }
            
            Button("Cancella storia bonus") {
                showingDeleteConfirmation = true
            }
            .foregroundColor(.red)
            .padding()
        }
        .navigationTitle("Bonus History")
        .alert(isPresented: $showingDeleteConfirmation) {
            Alert(
                title: Text("Conferma cancellazione"),
                message: Text("Sei sicuro di voler cancellare la storia dei bonus?"),
                primaryButton: .destructive(Text("Cancella")) {
                    spinManager.clearBonusHistory(for: site)
                    presentationMode.wrappedValue.dismiss()
                },
                secondaryButton: .cancel()
            )
        }
    }
}

struct AutomationView: View {
    @ObservedObject private var spinManager = SpinManager.shared
    @State private var showingAddAutomation = false
    @State private var showingEditAutomation = false
    @State private var newAutomationSite = "goldbet"
    @State private var newAutomationTime = Date()
    @State private var editingAutomation: SpinAutomation?
    
    var body: some View {
        NavigationView {
            List {
                ForEach(spinManager.automations) { automation in
                    AutomationRow(automation: automation)
                        .swipeActions(edge: .leading) {
                            Button("Modifica") {
                                editingAutomation = automation
                                newAutomationSite = automation.site
                                newAutomationTime = automation.time
                                showingEditAutomation = true
                            }
                            .tint(.blue)
                        }
                        .swipeActions(edge: .trailing) {
                            Button("Elimina", role: .destructive) {
                                spinManager.removeAutomation(automation)
                            }
                        }
                }
            }
            .onAppear {
                    spinManager.loadSavedAutomations()
            }
            .onAppear {
                spinManager.forceUpdate()
            }
            .navigationTitle("Automazioni Spin")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingAddAutomation = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
        }
        .sheet(isPresented: $showingAddAutomation) {
            AddAutomationView(site: $newAutomationSite, time: $newAutomationTime, onSave: {
                let newAutomation = SpinAutomation(site: newAutomationSite, time: newAutomationTime, isEnabled: true)
                spinManager.addAutomation(newAutomation)
                showingAddAutomation = false
            })
        }
        .sheet(isPresented: $showingEditAutomation) {
            AddAutomationView(site: $newAutomationSite, time: $newAutomationTime, onSave: {
                if let editingAutomation = editingAutomation {
                    let updatedAutomation = SpinAutomation(site: newAutomationSite, time: newAutomationTime, isEnabled: editingAutomation.isEnabled)
                    spinManager.updateAutomation(updatedAutomation)
                    print("Automazione aggiornata: \(updatedAutomation)")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        spinManager.forceUpdate()
                        print("Aggiornamento forzato")
                    }
                }
                showingEditAutomation = false
            })
        }
    }
}



struct AddAutomationView: View {
    @ObservedObject private var spinManager = SpinManager.shared
    @Binding var site: String
    @Binding var time: Date
    let onSave: () -> Void
    @Environment(\.presentationMode) var presentationMode
    
    let sites = ["goldbet", "lottomatica", "snai"]
    
    var body: some View {
        NavigationView {
            Form {
                Picker("Sito", selection: $site) {
                    ForEach(sites, id: \.self) { site in
                        Text(site)
                    }
                }
                DatePicker("Orario", selection: $time, displayedComponents: .hourAndMinute)
            }
            .navigationTitle("Aggiungi Automazione")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Salva") {
                        onSave();
                        presentationMode.wrappedValue.dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                            spinManager.objectWillChange.send()
                        }
                    }
                }
            }
        }
    }
}

struct AutomationRow: View {
    @ObservedObject private var spinManager = SpinManager.shared
    let automation: SpinAutomation
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(automation.site)
                Text(automation.time, style: .time)
            }
            Spacer()
            Toggle("", isOn: Binding(
                get: { automation.isEnabled },
                set: { _ in spinManager.toggleAutomation(automation) }
            ))
        }
    }
}

class SpinManager: NSObject, ObservableObject {
    @Published var bonusHistory: [String: [BonusInfo]] = [:]
    @Published var automations: [SpinAutomation] = []
    static let shared = SpinManager()
    private var cancellables = Set<AnyCancellable>()
    var backgroundCompletionHandler: (() -> Void)?
    private var backgroundTasks: [() -> Void] = []
    
    private lazy var backgroundSession: URLSession = {
        let config = URLSessionConfiguration.background(withIdentifier: "simogatti.BetBox.backgroundsession")
        config.sessionSendsLaunchEvents = true
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()
    
    override private init() {
        super.init()
        loadSavedData()
        setupAutomationTimer()
        registerBackgroundTasks()
    }
    
    func forceUpdate() {
        objectWillChange.send()
    }

    
    func loadSavedData() {
        loadSavedBonusHistory()
        loadSavedAutomations()
        cleanupOldBonuses()
        checkMissedAutomations()
    }
    
    func appDidBecomeActive() {
        checkMissedAutomations()
    }
    
    func checkMissedAutomations() {
        let now = Date()
        let calendar = Calendar.current
        
        for automation in automations where automation.isEnabled {
            let lastMidnight = calendar.startOfDay(for: now)
            if automation.time < now && automation.time > lastMidnight && !isSpinPerformedToday(for: automation.site) {
                performSpinInBackground(for: automation.site)
            }
        }
    }

    
    func loadSavedAutomations() {
        if let data = try? Data(contentsOf: getAutomationsFileURL()),
           let savedAutomations = try? JSONDecoder().decode([SpinAutomation].self, from: data) {
            automations = savedAutomations
        }
    }
    
    func saveAutomations() {
        if let data = try? JSONEncoder().encode(automations) {
            try? data.write(to: getAutomationsFileURL())
        }
    }
    
    private func getAutomationsFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("spinAutomations.json")
    }
    
    func addAutomation(_ automation: SpinAutomation) {
        automations.append(automation)
        saveAutomations()
        scheduleNotification(for: automation)
    }
    
    func removeAutomation(_ automation: SpinAutomation) {
        automations.removeAll { $0.id == automation.id }
        saveAutomations()
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [automation.id.uuidString])
    }
    
    func toggleAutomation(_ automation: SpinAutomation) {
        if let index = automations.firstIndex(where: { $0.id == automation.id }) {
            automations[index].isEnabled.toggle()
            saveAutomations()
            if automations[index].isEnabled {
                scheduleNotification(for: automations[index])
            } else {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [automation.id.uuidString])
            }
        }
    }
    
    private func setupAutomationTimer() {
        Timer.publish(every: 60, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.checkAndPerformAutomations()
            }
            .store(in: &cancellables)
    }
    
    func checkAndPerformAutomations() {
        let now = Date()
        for automation in automations where automation.isEnabled {
            let automationTime = Calendar.current.dateComponents([.hour, .minute], from: automation.time)
            let currentTime = Calendar.current.dateComponents([.hour, .minute], from: now)
            
            if automationTime == currentTime && !isSpinPerformedToday(for: automation.site) {
                performSpinInBackground(for: automation.site)
            }
        }
    }
    
    private func scheduleNotification(for automation: SpinAutomation) {
        let content = UNMutableNotificationContent()
        content.title = "Spin Automatico"
        content.body = "È ora di eseguire lo spin per \(automation.site)"
        content.sound = UNNotificationSound.default
        
        let components = Calendar.current.dateComponents([.hour, .minute], from: automation.time)
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        
        let request = UNNotificationRequest(identifier: automation.id.uuidString, content: content, trigger: trigger)
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Errore nella programmazione della notifica: \(error)")
            }
        }
    }
    
    func loadSavedBonusHistory() {
        if let data = try? Data(contentsOf: getBonusHistoryFileURL()),
           let savedHistory = try? JSONDecoder().decode([String: [BonusInfo]].self, from: data) {
            bonusHistory = savedHistory
        }
    }
    
    func saveBonusHistory() {
        if let data = try? JSONEncoder().encode(bonusHistory) {
            try? data.write(to: getBonusHistoryFileURL())
        }
    }
    
    private func getBonusHistoryFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("bonusHistory.json")
    }
    
    func performSpin(for site: String) {
        guard !isSpinPerformedToday(for: site) else { return }
        
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/spin/\(site)"
        guard let url = URL(string: urlString) else {
            print("URL non valido per \(site)")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        
        let task = backgroundSession.dataTask(with: request)
        task.resume()
    }
    
    func checkAllSpinStatus() {
        for site in ["goldbet", "lottomatica", "snai"] {
            objectWillChange.send()
        }
    }
    
    private func addBonusToHistory(site: String, bonusInfo: BonusInfo) {
        if var siteHistory = bonusHistory[site] {
            siteHistory.append(bonusInfo)
            bonusHistory[site] = siteHistory
        } else {
            bonusHistory[site] = [bonusInfo]
        }
    }
    
    private func cleanupOldBonuses() {
        let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        for (site, bonuses) in bonusHistory {
            bonusHistory[site] = bonuses.filter { $0.date > fiveDaysAgo }
        }
        saveBonusHistory()
    }
    
    func isSpinPerformedToday(for site: String) -> Bool {
        guard let siteHistory = bonusHistory[site] else { return false }
        let today = Calendar.current.startOfDay(for: Date())
        return siteHistory.contains { Calendar.current.isDate($0.date, inSameDayAs: today) }
    }
    
    func getLastBonus(for site: String) -> BonusInfo? {
        return bonusHistory[site]?.last
    }
    
    func clearBonusHistory(for site: String) {
        bonusHistory[site] = []
        saveBonusHistory()
    }

    func processBackgroundTasks(completion: @escaping () -> Void) {
        let tasks = backgroundTasks
        backgroundTasks.removeAll()
        
        let group = DispatchGroup()
        
        for task in tasks {
            group.enter()
            DispatchQueue.global().async {
                task()
                group.leave()
            }
        }
        
        group.notify(queue: .main) {
            completion()
            self.backgroundCompletionHandler?()
            self.backgroundCompletionHandler = nil
        }
    }
    
    func updateAutomation(_ updatedAutomation: SpinAutomation) {
        print ("entro in updateAutomation")
        if let index = automations.firstIndex(where: { $0.id == updatedAutomation.id }) {
            print ("Automazione trovata")
            automations[index] = updatedAutomation
            saveAutomations()
            objectWillChange.send()
            if updatedAutomation.isEnabled {
                scheduleNotification(for: updatedAutomation)
                scheduleBackgroundTask(for: updatedAutomation)
            } else {
                UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [updatedAutomation.id.uuidString])
                cancelBackgroundTask(for: updatedAutomation)
            }
            objectWillChange.send()
        }
    }


        private func registerBackgroundTasks() {
            BGTaskScheduler.shared.register(forTaskWithIdentifier: "simogatti.BetBox.spinautomation", using: nil) { task in
                self.handleBackgroundTask(task: task as! BGAppRefreshTask)
            }
        }

        private func scheduleBackgroundTask(for automation: SpinAutomation) {
            let request = BGAppRefreshTaskRequest(identifier: "simogatti.BetBox.spinautomation")
            request.earliestBeginDate = automation.time
            
            do {
                try BGTaskScheduler.shared.submit(request)
            } catch {
                print("Errore nella programmazione del task in background: \(error)")
            }
        }

        private func cancelBackgroundTask(for automation: SpinAutomation) {
            BGTaskScheduler.shared.cancel(taskRequestWithIdentifier: "simogatti.BetBox.spinautomation")
        }

        func handleBackgroundTask(task: BGAppRefreshTask) {
            task.expirationHandler = {
                task.setTaskCompleted(success: false)
            }

            checkAndPerformAutomations()

            task.setTaskCompleted(success: true)
        }

        func performSpinInBackground(for site: String) {
            let urlString = "https://legally-modest-joey.ngrok-free.app/spin/\(site)"
            guard let url = URL(string: urlString) else { return }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            
            let task = backgroundSession.dataTask(with: request)
            task.resume()
        }
    }


extension SpinManager: URLSessionDelegate, URLSessionDataDelegate {
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        DispatchQueue.main.async {
            do {
                let bonusInfo = try JSONDecoder().decode(BonusInfo.self, from: data)
                self.addBonusToHistory(site: dataTask.originalRequest?.url?.lastPathComponent ?? "", bonusInfo: bonusInfo)
                self.saveBonusHistory()
            } catch {
                print("Errore nella decodifica: \(error)")
            }
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("Errore nella richiesta: \(error)")
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
}

struct BonusInfo: Codable, Identifiable {
    let id = UUID()
    let tipo: String
    let valore: String
    let date: Date
    
    enum CodingKeys: String, CodingKey {
        case tipo, valore
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        tipo = try container.decode(String.self, forKey: .tipo)
        valore = try container.decode(String.self, forKey: .valore)
        date = Date()
    }
}

private let itemFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .short
    return formatter
}()

