//
//  SpinView.swift
//  BetBox
//
//  Created by Simo on 14/08/24.
//

import SwiftUI
import Combine

struct SpinView: View {
    @ObservedObject private var spinManager = SpinManager.shared
    
    let sites = ["goldbet", "bet365", "eurobet"]
    
    var body: some View {
        NavigationView {
            ScrollView {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 20) {
                    ForEach(sites, id: \.self) { site in
                        SiteSpinView(site: site, spinStatus: spinManager.spinStatus[site] ?? false) {
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
        .onAppear(perform: spinManager.loadSavedSpinStatus)
    }
}

struct SiteSpinView: View {
    let site: String
    let spinStatus: Bool
    let action: () -> Void
    
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
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
    }
}

class SpinManager: ObservableObject {
    @Published var spinStatus: [String: Bool] = [:]
    static let shared = SpinManager()
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        loadSavedSpinStatus()
    }
    
    func loadSavedSpinStatus() {
        if let data = try? Data(contentsOf: getSpinStatusFileURL()),
           let savedStatus = try? JSONDecoder().decode([String: Bool].self, from: data) {
            spinStatus = savedStatus
        }
    }
    
    func saveSpinStatus() {
        if let data = try? JSONEncoder().encode(spinStatus) {
            try? data.write(to: getSpinStatusFileURL())
        }
    }
    
    private func getSpinStatusFileURL() -> URL {
        let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        return documentsDirectory.appendingPathComponent("spinStatus.json")
    }
    
    func performSpin(for site: String) {
        LogManager.shared.prepareForAPIRequest()
        
        let urlString = "https://legally-modest-joey.ngrok-free.app/spin/\(site)"
        guard let url = URL(string: urlString) else { return }
        
        URLSession.shared.dataTaskPublisher(for: url)
            .retry(3)
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
                self?.saveSpinStatus()
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
}

struct SpinResponse: Codable {
    let success: Bool
}

struct SpinStatus: Codable {
    let site: String
    let spinPerformed: Bool
}
