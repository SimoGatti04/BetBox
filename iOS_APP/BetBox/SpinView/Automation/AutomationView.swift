import SwiftUI

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
                        onSave()
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
