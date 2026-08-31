const { db } = require('../config/db'); 

// ==========================================
// PROMISE WRAPPERS UNTUK TRANSAKSI MYSQL2
// ==========================================
const getConnection = () => new Promise((resolve, reject) => {
    db.getConnection((err, conn) => {
        if (err) return reject(err);
        resolve(conn);
    });
});

const queryConn = (conn, sql, params) => new Promise((resolve, reject) => {
    conn.query(sql, params, (err, results) => {
        if (err) return reject(err);
        resolve(results); 
    });
});

const beginTransaction = (conn) => new Promise((resolve, reject) => {
    conn.beginTransaction(err => err ? reject(err) : resolve());
});

const commitTransaction = (conn) => new Promise((resolve, reject) => {
    conn.commit(err => err ? reject(err) : resolve());
});

const rollbackTransaction = (conn) => new Promise(resolve => {
    conn.rollback(() => resolve());
});

// ==========================================
// ALGORITMA WEIGHTED RANDOM
// ==========================================
const pickPrizesWeighted = (availablePrizes, neededCount) => {
    let selectedPrizes = [];
    let pool = availablePrizes.map(p => ({ ...p }));

    for (let i = 0; i < neededCount; i++) {
        const totalStock = pool.reduce((sum, prize) => sum + prize.stok_sisa, 0);
        if (totalStock === 0) break; 

        let randomWeight = Math.floor(Math.random() * totalStock);
        
        for (let prize of pool) {
            if (randomWeight < prize.stok_sisa) {
                selectedPrizes.push({
                    id_hadiah: prize.id_hadiah,
                    nama_hadiah: prize.nama_hadiah,
                    tipe: prize.tipe
                });
                prize.stok_sisa -= 1;
                break;
            }
            randomWeight -= prize.stok_sisa;
        }
    }
    return selectedPrizes;
};

// ==========================================
// EKSEKUSI UTAMA SPIN (DIJALANKAN SAAT "STOP")
// ==========================================
const executeSpin = async (id_kelompok) => {
    const connection = await getConnection(); 

    try {
        await beginTransaction(connection); 
        
        const sesi = await queryConn(connection, 
            `SELECT target_jumlah_pemenang, tipe_event FROM kelompok_hadiah WHERE id_kelompok = ? FOR UPDATE`, 
            [id_kelompok]
        );
        if (!sesi || sesi.length === 0) throw new Error("Sesi tidak ditemukan");

        const prizes = await queryConn(connection, 
            `SELECT id_hadiah, nama_hadiah, tipe, stok_sisa FROM hadiah WHERE id_kelompok = ? AND stok_sisa > 0 FOR UPDATE`,
            [id_kelompok]
        );
        
        const totalSisaStok = prizes.reduce((sum, p) => sum + p.stok_sisa, 0);
        if (totalSisaStok === 0) throw new Error("Stok hadiah untuk sesi ini sudah habis!");

        const jumlahPemenang = Math.min(sesi[0].target_jumlah_pemenang, totalSisaStok);

        const users = await queryConn(connection, 
            `SELECT id_user, nama_lengkap, id_divisi FROM users 
             WHERE status_terdaftar = 'sudah' AND status_menang = 'belum' 
             ORDER BY RAND() LIMIT ?`,
            [jumlahPemenang]
        );

        if (users.length === 0) throw new Error("Tidak ada peserta yang memenuhi syarat");

        const finalWinnerCount = Math.min(jumlahPemenang, users.length);
        const assignedPrizes = pickPrizesWeighted(prizes, finalWinnerCount);
        const hasilPemenang = [];

        for (let i = 0; i < finalWinnerCount; i++) {
            const user = users[i];
            const prize = assignedPrizes[i];

            await queryConn(connection, 
                `INSERT INTO pemenang (id_user, id_hadiah, id_kelompok, mode_undian) VALUES (?, ?, ?, ?)`,
                [user.id_user, prize.id_hadiah, id_kelompok, sesi[0].tipe_event]
            );

            await queryConn(connection, 
                `UPDATE hadiah SET stok_sisa = stok_sisa - 1 WHERE id_hadiah = ?`,
                [prize.id_hadiah]
            );

            await queryConn(connection, 
                `UPDATE users SET status_menang = 'sudah' WHERE id_user = ?`,
                [user.id_user]
            );

            hasilPemenang.push({
                id_user: user.id_user,
                nama_lengkap: user.nama_lengkap,
                id_divisi: user.id_divisi,
                nama_hadiah: prize.nama_hadiah
            });
        }

        await commitTransaction(connection);
        connection.release(); 
        
        return {
            mode: sesi[0].tipe_event,
            jumlah_slot: finalWinnerCount,
            winners: hasilPemenang
        };

    } catch (error) {
        await rollbackTransaction(connection); 
        connection.release();
        throw error;
    }
};

// ==========================================
// UNDO SPIN (DIJALANKAN SAAT "RESPIN")
// ==========================================
const undoSpin = async (id_kelompok) => {
    const connection = await getConnection(); 
    try {
        await beginTransaction(connection); 

        const pemenang = await queryConn(connection, 
            `SELECT id_hadiah FROM pemenang WHERE id_kelompok = ?`, 
            [id_kelompok]
        );

        for (let p of pemenang) {
            await queryConn(connection, 
                `UPDATE hadiah SET stok_sisa = stok_sisa + 1 WHERE id_hadiah = ?`, 
                [p.id_hadiah]
            );
        }

        await queryConn(connection, 
            `UPDATE users SET status_menang = 'belum' WHERE id_user IN (SELECT id_user FROM pemenang WHERE id_kelompok = ?)`, 
            [id_kelompok]
        );

        await queryConn(connection, 
            `DELETE FROM pemenang WHERE id_kelompok = ?`, 
            [id_kelompok]
        );

        await commitTransaction(connection);
        connection.release();
        return true;
    } catch (error) {
        await rollbackTransaction(connection);
        connection.release();
        throw error;
    }
};

const setActiveSessionDB = async (id_kelompok) => {
    const connection = await getConnection();
    try {
        await beginTransaction(connection);
        await queryConn(connection, `UPDATE kelompok_hadiah SET status_sesi = 'pending' WHERE status_sesi = 'active'`);
        
        if (id_kelompok) {
            await queryConn(connection, `UPDATE kelompok_hadiah SET status_sesi = 'active' WHERE id_kelompok = ?`, [id_kelompok]);
        }
        
        await commitTransaction(connection);
        connection.release();
    } catch (error) {
        await rollbackTransaction(connection);
        connection.release();
        throw error;
    }
};

// FUNGSI BARU UNTUK FETCH DB ACTIVE SAAT RAM KOSONG
const getActiveSessionFromDB = async () => {
    const connection = await getConnection();
    try {
        const rows = await queryConn(connection, `SELECT * FROM kelompok_hadiah WHERE status_sesi = 'active' LIMIT 1`, []);
        connection.release();
        return rows[0] || null;
    } catch (error) {
        connection.release();
        throw error;
    }
};

const moveToNextSession = async (current_id) => {
    const connection = await getConnection();
    try {
        const currentId = Number(current_id);
        if (!Number.isInteger(currentId) || currentId < 1) {
            throw new Error("ID sesi tidak valid");
        }

        await beginTransaction(connection);

        await queryConn(connection, `UPDATE kelompok_hadiah SET status_sesi = 'complate' WHERE id_kelompok = ?`, [currentId]);
        
        let nextSession = await queryConn(connection, 
            `SELECT * FROM kelompok_hadiah WHERE id_kelompok > ? AND status_sesi = 'pending' ORDER BY id_kelompok ASC LIMIT 1`, 
            [currentId]
        );
        
        if (nextSession.length === 0) {
            nextSession = await queryConn(connection, 
                `SELECT * FROM kelompok_hadiah WHERE id_kelompok >= 1 AND status_sesi = 'pending' ORDER BY id_kelompok ASC LIMIT 1`, 
                []
            );
        }

        if (nextSession.length > 0) {
            await queryConn(connection, `UPDATE kelompok_hadiah SET status_sesi = 'active' WHERE id_kelompok = ?`, [nextSession[0].id_kelompok]);
        }
        
        await commitTransaction(connection);
        connection.release();
        
        if (nextSession.length === 0) return null; 
        
        return {
            id_kelompok: nextSession[0].id_kelompok,
            nama_kelompok: nextSession[0].nama_kelompok,
            jumlah_slot: nextSession[0].target_jumlah_pemenang,
            mode: nextSession[0].tipe_event
        };
    } catch (error) {
        connection.release();
        throw error;
    }
};

const getAllSessions = async () => {
    const connection = await getConnection();
    try {
        const sessions = await queryConn(connection, `SELECT * FROM kelompok_hadiah ORDER BY id_kelompok ASC`, []);
        connection.release();
        return sessions;
    } catch (error) {
        connection.release();
        throw error;
    }
};

module.exports = { 
    executeSpin, 
    undoSpin, 
    setActiveSessionDB, 
    getActiveSessionFromDB, 
    moveToNextSession, 
    getAllSessions 
};