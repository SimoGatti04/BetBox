import SwiftUI
import Combine
import UserNotifications

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
    @State private var newAutomationSite = "goldbet"
    @State private var newAutomationTime = Date()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(spinManager.automations) { automation in
                    AutomationRow(automation: automation)
                }
                .onDelete(perform: deleteAutomation)
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
    }
    
    private func deleteAutomation(at offsets: IndexSet) {
        offsets.forEach { index in
            let automation = spinManager.automations[index]
            spinManager.removeAutomation(automation)
        }
    }
}

struct AddAutomationView: View {
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
                        onSave()
                        presentationMode.wrappedValue.dismiss()
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

class SpinManager: ObservableObject {
    @Published var bonusHistory: [String: [BonusInfo]] = [:]
    @Published var automations: [SpinAutomation] = []
    static let shared = SpinManager()
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        loadSavedData()
        setupAutomationTimer()
    }
    
    func loadSavedData() {
        loadSavedBonusHistory()
        loadSavedAutomations()
        cleanupOldBonuses()
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
    
    private func checkAndPerformAutomations() {
        let now = Date()
        for automation in automations where automation.isEnabled {
            let automationTime = Calendar.current.dateComponents([.hour, .minute], from: automation.time)
            let currentTime = Calendar.current.dateComponents([.hour, .minute], from: now)
            
            if automationTime == currentTime && !isSpinPerformedToday(for: automation.site) {
                performSpin(for: automation.site)
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
        request.timeoutInterval = 120 // Aumentiamo il timeout a 120 secondi
        
        print("Inizio richiesta per \(site)")
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Errore nella richiesta per \(site): \(error.localizedDescription)")
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                print("Risposta non valida per \(site)")
                return
            }
            
            print("Codice di stato HTTP per \(site): \(httpResponse.statusCode)")
            
            guard let data = data else {
                print("Nessun dato ricevuto per \(site)")
                return
            }
            
            print("Dati ricevuti per \(site): \(String(data: data, encoding: .utf8) ?? "Non decodificabile")")
            
            do {
                let bonusInfo = try JSONDecoder().decode(BonusInfo.self, from: data)
                print("Bonus decodificato per \(site): \(bonusInfo)")
                DispatchQueue.main.async {
                    self.addBonusToHistory(site: site, bonusInfo: bonusInfo)
                    self.saveBonusHistory()
                }
            } catch {
                print("Errore nella decodifica per \(site): \(error.localizedDescription)")
            }
            
            LogManager.shared.finishAPIRequest()
        }.resume()
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
