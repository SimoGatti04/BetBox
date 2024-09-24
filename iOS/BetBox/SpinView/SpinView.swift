import SwiftUI

struct SpinView: View {
    @ObservedObject private var spinManager = SpinManager.shared
    
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
            .onAppear {
                spinManager.fetchBonusHistory()
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: spinManager.checkAllSpinStatus) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
        .onAppear(perform: spinManager.loadSavedData)
        .onAppear {
            spinManager.fetchBonusHistory()
        }
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
                        Text("\(bonus.result.tipo): \(bonus.result.valore)")
                        }
                    } else {
                        Text("Nessun bonus recente")
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
            .sheet(isPresented: $showingBonusHistory) {
            BonusHistoryView(bonusHistory: bonusHistory, site: site)
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
                    Text("Tipo: \(bonus.result.tipo)")
                    Text("Valore: \(bonus.result.valore)")
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

private let itemFormatter: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .short
    formatter.timeStyle = .short
    return formatter
}()
