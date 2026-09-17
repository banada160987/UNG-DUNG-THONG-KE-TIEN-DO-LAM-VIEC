// --- DATA STORAGE & STATE ---
let dataStore = {};
let mappingHistory = {}; // Thêm kho lưu trữ mapping theo cấu trúc file
let activeFileName = null;
let excelData = [];
let columnNames = [];
let activeValidationMode = 'none';
let masterFileName = null;

const DB_NAME = 'SMAS_DataDB';
const STORE_NAME = 'dataStore';
function makeReactiveArray(arr, onChange) {
    if (!arr) return arr;
    return new Proxy(arr, {
        get(target, prop, receiver) {
            const val = Reflect.get(target, prop, receiver);
            if (typeof val === 'function') {
                const mutatingMethods = ['push', 'pop', 'shift', 'unshift', 'splice', 'reverse', 'sort'];
                if (mutatingMethods.includes(prop)) {
                    return function(...args) {
                        const result = val.apply(target, args);
                        onChange(target);
                        return result;
                    };
                }
            }
            return val;
        }
    });
}

let _legacyProctorList = [
    { name: "Nguyễn Văn A", unit: "Toán", classes: ["12A1"] },
    { name: "Trần Thị B", unit: "Văn", classes: ["12A2"] },
    { name: "Lê Văn C", unit: "Anh", classes: ["12A3"] },
    { name: "Phạm Thị D", unit: "Lý", classes: ["12A4"] },
    { name: "Hoàng Văn E", unit: "Hóa", classes: ["12A5"] },
    { name: "Đặng Thị F", unit: "Sinh", classes: ["12A6"] },
    { name: "Bùi Văn G", unit: "Sử", classes: ["12A7"] },
    { name: "Vũ Thị H", unit: "Địa", classes: ["12A8"] },
    { name: "Phan Văn I", unit: "GDKT", classes: ["12A9"] },
    { name: "Ngô Thị K", unit: "Tin", classes: ["12A10"] }
];
let _legacyGeneratedRooms = [];
let _legacyExamIncidents = [];
let _legacyRoomSeats = {};

Object.defineProperty(window, 'examIncidents', {
    get() {
        return makeReactiveArray(_legacyExamIncidents, (updatedList) => {
            _legacyExamIncidents = updatedList;
            saveToDB();
        });
    },
    set(val) {
        _legacyExamIncidents = val || [];
        saveToDB();
    },
    configurable: true
});

Object.defineProperty(window, 'roomSeats', {
    get() {
        return _legacyRoomSeats;
    },
    set(val) {
        _legacyRoomSeats = val || {};
        saveToDB();
    },
    configurable: true
});

Object.defineProperty(window, 'graduationGpaDefault', {
    get() {
        const saved = localStorage.getItem('vtool_graduation_gpa_default');
        return saved ? parseFloat(saved) : 7.5;
    },
    set(val) {
        localStorage.setItem('vtool_graduation_gpa_default', val);
    },
    configurable: true
});

Object.defineProperty(window, 'proctorList', {
    get() {
        const list = (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.getState === 'function') ? 
                     window.ProctorStore.getState().proctors : _legacyProctorList;
        return makeReactiveArray(list, (updatedList) => {
            if (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.setProctors === 'function') {
                window.ProctorStore.setProctors(updatedList);
            } else {
                _legacyProctorList = updatedList;
            }
        });
    },
    set(val) {
        if (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.setProctors === 'function') {
            window.ProctorStore.setProctors(val);
        } else {
            _legacyProctorList = val;
        }
    },
    configurable: true
});

Object.defineProperty(window, 'generatedRooms', {
    get() {
        const list = (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.getState === 'function') ? 
                     window.ProctorStore.getState().rooms : _legacyGeneratedRooms;
        return makeReactiveArray(list, (updatedList) => {
            if (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.setRooms === 'function') {
                window.ProctorStore.setRooms(updatedList);
            } else {
                _legacyGeneratedRooms = updatedList;
            }
        });
    },
    set(val) {
        if (typeof window.ProctorStore !== 'undefined' && typeof window.ProctorStore.setRooms === 'function') {
            window.ProctorStore.setRooms(val);
        } else {
            _legacyGeneratedRooms = val;
        }
    },
    configurable: true
});
let independentSessionLabels = ["Văn", "Toán", "Tự chọn 1", "Tự chọn 2"];
const subjects = ['anh', 'ly', 'hoa', 'sinh', 'su', 'dia', 'gdkt', 'tin', 'cnn', 'cnc', 'nhat', 'trung', 'han', 'phap', 'nga', 'duc'];
const subjectLabels = ["Anh", "Lý", "Hóa", "Sinh", "Sử", "Địa", "GDKTPL", "Tin", "CNN", "CNC", "Nhật", "Trung", "Hàn", "Pháp", "Nga", "Đức"];

let graduationRules = { address: {}, school: {}, ethnic: {} };
function initGraduationRules() {
    const saved = localStorage.getItem('vtool_village_mapping');
    if (!saved) return;
    try {
        const parsed = JSON.parse(saved);
        if (parsed && !parsed.address && !parsed.school && !parsed.ethnic) { graduationRules.address = parsed; }
        else { graduationRules = { ...graduationRules, ...parsed }; }
    } catch (e) { console.error("Lỗi load cấu hình Diện:", e); }
}

function cleanProxy(obj) {
    if (obj === null || obj === undefined) return obj;
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (e) {
        console.warn("cleanProxy JSON fallback failed, using recursive clone:", e);
        const seen = new WeakSet();
        function deepClean(item) {
            if (item === null || typeof item !== 'object') return item;
            if (seen.has(item)) return null;
            seen.add(item);
            if (Array.isArray(item)) {
                return item.map(x => deepClean(x));
            }
            const clean = {};
            for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                    clean[key] = deepClean(item[key]);
                }
            }
            return clean;
        }
        return deepClean(obj);
    }
}

async function initDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => { e.target.result.createObjectStore(STORE_NAME); };
        request.onsuccess = () => resolve();
    });
}

async function saveToDB() {
    try {
        const dbReq = indexedDB.open(DB_NAME, 1);
        dbReq.onsuccess = (e) => {
            try {
                const db = e.target.result;
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                store.put(cleanProxy(dataStore), 'app_dataStore');
                store.put(cleanProxy(mappingHistory), 'app_mappingHistory');
                
                // Tránh lỗi DataCloneError khi lưu đối tượng Proxy vào IndexedDB (Structured Clone Algorithm)
                const plainRooms = Array.isArray(generatedRooms) ? [...generatedRooms] : [];
                store.put(cleanProxy(plainRooms), 'app_generatedRooms'); // Lưu danh sách phòng & giám thị
                
                store.put(cleanProxy(window.examIncidents || []), 'app_examIncidents');
                store.put(cleanProxy(window.roomSeats || {}), 'app_roomSeats');
                
                if (activeFileName) store.put(activeFileName, 'app_activeFileName'); // Lưu tệp đang hoạt động
                
                tx.onerror = (err) => {
                    console.error("IndexedDB Transaction Error trong saveToDB:", err);
                };
            } catch (innerErr) {
                console.error("Lỗi trong onsuccess handler của saveToDB:", innerErr);
            }
        };
        dbReq.onerror = (err) => {
            console.error("IndexedDB open failed trong saveToDB:", err);
        };
    } catch (e) {
        console.error("Lỗi đồng bộ IndexedDB (saveToDB):", e);
    }
}

async function loadFromDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) { resolve(null); return; }
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            
            const reqData = store.get('app_dataStore');
            reqData.onsuccess = () => {
                const reqMap = store.get('app_mappingHistory');
                reqMap.onsuccess = () => {
                    const reqRooms = store.get('app_generatedRooms');
                    reqRooms.onsuccess = () => {
                        const reqActiveFile = store.get('app_activeFileName');
                        reqActiveFile.onsuccess = () => {
                            const reqIncidents = store.get('app_examIncidents');
                            reqIncidents.onsuccess = () => {
                                const reqSeats = store.get('app_roomSeats');
                                reqSeats.onsuccess = () => {
                                    resolve({
                                        dataStore: reqData.result || {},
                                        mappingHistory: reqMap.result || {},
                                        generatedRooms: reqRooms.result || [],
                                        activeFileName: reqActiveFile.result || null,
                                        examIncidents: reqIncidents.result || [],
                                        roomSeats: reqSeats.result || {}
                                    });
                                };
                                reqSeats.onerror = () => {
                                    resolve({
                                        dataStore: reqData.result || {},
                                        mappingHistory: reqMap.result || {},
                                        generatedRooms: reqRooms.result || [],
                                        activeFileName: reqActiveFile.result || null,
                                        examIncidents: reqIncidents.result || [],
                                        roomSeats: {}
                                    });
                                };
                            };
                            reqIncidents.onerror = () => {
                                resolve({
                                    dataStore: reqData.result || {},
                                    mappingHistory: reqMap.result || {},
                                    generatedRooms: reqRooms.result || [],
                                    activeFileName: reqActiveFile.result || null,
                                    examIncidents: [],
                                    roomSeats: {}
                                });
                            };
                        };
                        reqActiveFile.onerror = () => {
                            resolve({
                                dataStore: reqData.result || {},
                                mappingHistory: reqMap.result || {},
                                generatedRooms: reqRooms.result || [],
                                activeFileName: null,
                                examIncidents: [],
                                roomSeats: {}
                            });
                        };
                    };
                };
            };
        };
    });
}


