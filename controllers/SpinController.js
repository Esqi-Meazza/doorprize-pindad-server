const spinService = require('../services/SpinService');

let currentStageState = {
    appState: 'STANDBY', 
    sessionData: null,   
    winners: []          
};

// PERUBAHAN: JADI ASYNC & FALLBACK KE DB JIKA RAM KOSONG
const getCurrentState = async (req, res) => {
    try {
        if (!currentStageState.sessionData) {
            const activeSession = await spinService.getActiveSessionFromDB();
            if (activeSession) {
                currentStageState.sessionData = {
                    id_kelompok: activeSession.id_kelompok,
                    title: activeSession.nama_kelompok,
                    jumlah_slot: activeSession.target_jumlah_pemenang,
                    mode: activeSession.tipe_event
                };
            }
        }
        res.status(200).json({ data: currentStageState });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const setSession = async (req, res) => {
    const { id_kelompok, nama_kelompok, jumlah_slot, mode } = req.body;
    const io = req.app.get('io');
    
    try {
        await spinService.setActiveSessionDB(id_kelompok);

        currentStageState = {
            appState: 'STANDBY',
            sessionData: { id_kelompok, title: nama_kelompok, jumlah_slot, mode },
            winners: []
        };

        io.emit('SESSION_CHANGED', currentStageState.sessionData);
        res.status(200).json({ message: "Sesi panggung berhasil diubah", data: currentStageState.sessionData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const nextSession = async (req, res) => {
    try {
        const id_kelompok = Number(req.body?.id_kelompok);
        if (!Number.isInteger(id_kelompok) || id_kelompok < 1) {
            return res.status(400).json({ error: "ID sesi tidak valid" });
        }
        const io = req.app.get('io');
        
        const nextData = await spinService.moveToNextSession(id_kelompok);
        
        if (nextData) {
            currentStageState = {
                appState: 'STANDBY',
                sessionData: { 
                    id_kelompok: nextData.id_kelompok, 
                    title: nextData.nama_kelompok, 
                    jumlah_slot: nextData.jumlah_slot, 
                    mode: nextData.mode 
                },
                winners: []
            };
            io.emit('SESSION_CHANGED', currentStageState.sessionData);
            res.status(200).json({ message: "Sesi selanjutnya aktif", data: currentStageState.sessionData });
        } else {
            currentStageState = { appState: 'STANDBY', sessionData: null, winners: [] };
            io.emit('ALL_COMPLETED');
            res.status(200).json({ message: "Semua sesi telah selesai", data: null });
        }
    } catch (error) {
        console.error("NEXT SESSION ERROR:", error);
        res.status(400).json({ error: error.message });
    }
};

const startSpin = async (req, res) => {
    try {
        const { id_kelompok, nama_kelompok, jumlah_slot, mode } = req.body;
        const io = req.app.get('io'); 
        
        currentStageState = {
            appState: 'SPINNING',
            sessionData: { id_kelompok, title: nama_kelompok, jumlah_slot, mode },
            winners: []
        };

        io.emit('SPIN_STARTED', currentStageState.sessionData);
        res.status(200).json({ message: "Visual spin dimulai" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const stopSpin = async (req, res) => {
    try {
        const { id_kelompok } = req.body;
        const io = req.app.get('io');
        
        const hasilSpin = await spinService.executeSpin(id_kelompok);
        
        currentStageState.appState = 'RESULT';
        currentStageState.winners = hasilSpin.winners;
        if(currentStageState.sessionData) {
             currentStageState.sessionData.mode = hasilSpin.mode;
        }

        io.emit('SPIN_RESULT', { winners: hasilSpin.winners });
        res.status(200).json({ message: "Spin berhenti", data: hasilSpin });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const respinSpin = async (req, res) => {
    try {
        const { id_kelompok, nama_kelompok, jumlah_slot, mode } = req.body;
        const io = req.app.get('io');

        await spinService.undoSpin(id_kelompok);

        currentStageState = {
            appState: 'SPINNING',
            sessionData: { id_kelompok, title: nama_kelompok, jumlah_slot, mode },
            winners: []
        };

        io.emit('SPIN_STARTED', currentStageState.sessionData);
        res.status(200).json({ message: "Respin dieksekusi" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const clearStage = async (req, res) => {
    try {
        await spinService.setActiveSessionDB(null);
        currentStageState = { appState: 'STANDBY', sessionData: null, winners: [] };
        const io = req.app.get('io');
        io.emit('STAGE_CLEARED'); 
        res.status(200).json({ message: "Panggung dikosongkan" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllSessions = async (req, res) => {
    try {
        const sessions = await spinService.getAllSessions();
        res.status(200).json({ data: sessions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    startSpin, stopSpin, respinSpin, 
    getCurrentState, clearStage, 
    setSession, nextSession, getAllSessions 
};