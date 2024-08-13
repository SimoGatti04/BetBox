//
//  SpinView.swift
//  BetBox
//
//  Created by Aurora Bellini on 14/08/24.
//
import SwiftUI
import Combine

struct SpinView: View {
    @ObservedObject private var spinManager = SpinManager.shared
    
    let sites = ["goldbet", "lottomatica", "snai"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteSpinView(site: site, spinStatus: spinManager.spinStatus[site] ?? false, bonusHistory: spinManager.bonusHistory[site] ?? []) {
                            spinManager.performSpin(for: site)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Spin")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: spinManager.checkAllSpinStatus) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .onAppear(perform: spinManager.loadSavedData)
    }
}

struct SiteSpinView: View {
    let site: String
    let spinStatus: Bool
    let bonusHistory: [BonusInfo]
    let action: () -> Void
    @State private var showingBonusHistory = false
    
    var body: some View {
        VStack {
            Image(site.lowercased())
                .resizable()
                .scaledToFit()
                .frame(width: 50, height: 50)
            
            Button(action: action) {
                Image(systemName: "arrow.2.circlepath")
                    .font(.system(size: 30))
            }
            
            Text(spinStatus ? "Spin eseguito" : "Spin non eseguito")
                .foregroundColor(spinStatus ? .green : .red)
                .font(.caption)
            
            Button("Bonus History") {
                showingBonusHistory = true
            }
            .sheet(isPresented: $showingBonusHistory) {
                BonusHistoryView(bonusHistory: bonusHistory)
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
    }
}

struct BonusHistoryView: View {
    let bonusHistory: [BonusInfo]
    
    var body: some View {
        List(bonusHistory) { bonus in
            VStack(alignment: .leading) {
                Text("Bonus: \(bonus.amount)")
                Text("Date: \(bonus.date, formatter: itemFormatter)")
            }
        }
        .navigationTitle("Bonus History")
    }
}

class SpinManager: ObservableObject {
    @Published var spinStatus: [String: Bool] = [:]
    @Published var bonusHistory: [String: [BonusInfo]] = [:]
    static let shared = SpinManager()
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        loadSavedData()
    }
    
    func loadSavedData() {
        loadSavedSpinStatus()
        loadSavedBonusHistory()
        cleanupOldBonuses()
    }
    
    func loadSavedSpinStatus() {
        if let data = try? Data(contentsOf: getSpinStatusFileURL()),
           let savedStatus = try? JSONDecoder().decode([String: Bool].self, from: data) {
            spinStatus = savedStatus
        }
    }
    
    func loadSavedBonusHistory() {
        if let data = try? Data(contentsOf: getBonusHistoryFileURL()),
           let savedHistory = try? JSONDecoder().decode([String: [BonusInfo]].self, from: data) {
            bonusHistory = savedHistory
        }
    }
    
    func saveSpinStatus() {
        if let data = try? JSONEncoder().encode(spinStatus) {
            try? data.write(to: getSpinStatusFileURL())
        }
    }
    
    func saveBonusHistory() {
        if let data = try? JSONEncoder().encode(bonusHistory) {
            try? data.write(to: getBonusHistoryFileURL())
        }
    }
    
    private func getSpinStatusFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("spinStatus.json")
    }
    
    private func getBonusHistoryFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("bonusHistory.json")
    }
    
    func performSpin(for site: String) {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/spin/\(site)"
        guard let url = URL(string: urlString) else { return }
        
        var request = URLRequest(url : url)
        request.httpMethod = "POST"
        
        URLSession.shared.dataTaskPublisher(for: request)
            .map(\.data)
            .decode(type: SpinResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { completion in
                switch completion {
                case .finished:
                    break
                case .failure(let error):
                    print("Error performing spin for \(site): \(error)")
                }
                LogManager.shared.finishAPIRequest()
            }, receiveValue: { [weak self] response in
                self?.spinStatus[site] = response.success
                if let bonus = response.bonus {
                    self?.addBonusToHistory(site: site, bonus: bonus)
                }
                self?.saveSpinStatus()
                self?.saveBonusHistory()
            })
            .store(in: &cancellables)
    }
    
    func checkAllSpinStatus() {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/spin/status"
        guard let url = URL(string: urlString) else { return }
        
        URLSession.shared.dataTaskPublisher(for: url)
            .retry(3)
            .map(\.data)
            .decode(type: [SpinStatus].self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .sink(receiveCompletion: { completion in
                switch completion {
                case .finished:
                    break
                case .failure(let error):
                    print("Error checking spin status: \(error)")
                }
                LogManager.shared.finishAPIRequest()
            }, receiveValue: { [weak self] statuses in
                for status in statuses {
                    self?.spinStatus[status.site] = status.spinPerformed
                }
                self?.saveSpinStatus()
            })
            .store(in: &cancellables)
    }
    
    private func addBonusToHistory(site: String, bonus: String) {
        let newBonus = BonusInfo(amount: bonus, date: Date())
        if var siteHistory = bonusHistory[site] {
            siteHistory.append(newBonus)
            bonusHistory[site] = siteHistory
        } else {
            bonusHistory[site] = [newBonus]
        }
    }
    
    private func cleanupOldBonuses() {
        let fiveDaysAgo = Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        for (site, bonuses) in bonusHistory {
            bonusHistory[site] = bonuses.filter { $0.date > fiveDaysAgo }
        }
        saveBonusHistory()
    }
}

struct SpinResponse: Codable {
    let success: Bool
    let bonus: String?
}

struct SpinStatus: Codable {
    let site: String
    let spinPerformed: Bool
}

struct BonusInfo: Codable, Identifiable {
    let id = UUID()
    let amount: String
    let date: Date
}

private let itemFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .short
    return formatter
}()

