/**
 * PROCTOR STORE (State Service)
 * Layer: Data Access & State Management (Reactive)
 */

const ProctorStore = (() => {
    // Event Target for reactivity
    const storeEvents = new EventTarget();

    // Central State
    const rawState = {
        proctors: (window.proctorList && window.proctorList.length > 0) ? [...window.proctorList] : [],
        rooms: (window.generatedRooms && window.generatedRooms.length > 0) ? [...window.generatedRooms] : [],
        sessions: [],
        assignments: [],
        config: {}
    };

    // Proxy for deep reactivity (shallow level interception for top-level keys)
    const _state = new Proxy(rawState, {
        set(target, prop, value) {
            target[prop] = value;
            // Dispatch event when a top-level state changes
            storeEvents.dispatchEvent(new CustomEvent('stateChange', { 
                detail: { prop, value } 
            }));
            return true;
        }
    });

    return {
        // Reactive Setters
        setProctors(list) { _state.proctors = list; this.saveToLocal(); },
        setRooms(list) { _state.rooms = list; this.saveToLocal(); },
        setSessions(list) { _state.sessions = list; this.saveToLocal(); },
        setAssignments(list) { _state.assignments = list; this.saveToLocal(); },
        setConfig(config) { _state.config = config; this.saveToLocal(); },
        
        // Getters
        getState() { return { ...rawState }; }, // Return immutable clone
        getProctorById(id) { return rawState.proctors.find(p => p.id === id); },
        
        // Subscription mechanism
        subscribe(callback) {
            storeEvents.addEventListener('stateChange', (e) => callback(e.detail));
        },

        // Persistence
        saveToLocal() {
            try {
                localStorage.setItem('ProctorStore_Data', JSON.stringify(rawState));
            } catch (e) {
                console.error("ProctorStore: Save failed", e);
            }
        },
        
        loadFromLocal() {
            const saved = localStorage.getItem('ProctorStore_Data');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    Object.keys(parsed).forEach(key => {
                        _state[key] = parsed[key]; // Triggers Proxy setter
                    });
                } catch(e) { 
                    console.error("ProctorStore: Load failed", e); 
                }
            }
        },

        // File I/O
        exportToFile() {
            const data = JSON.stringify(rawState, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PROCTOR_CONFIG_${new Date().getTime()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        },

        importFromFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const json = JSON.parse(e.target.result);
                        Object.keys(json).forEach(key => {
                            _state[key] = json[key];
                        });
                        this.saveToLocal();
                        resolve(json);
                    } catch (err) { reject(err); }
                };
                reader.onerror = reject;
                reader.readAsText(file);
            });
        }
    };
})();

// Initialize load
ProctorStore.loadFromLocal();

window.ProctorStore = ProctorStore;
