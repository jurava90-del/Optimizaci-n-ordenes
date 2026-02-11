'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import styles from '../dashboard/dashboard.module.css';

const EXCEL_FILES = [
    {
        name: 'Soporte Sup',
        url: 'https://vuiuorjzonpyobpelyld.supabase.co/storage/v1/object/public/HDT/Muebles%20GODAI%20de%2063x48/HOJA%20DE%20RUTA%20%20SOPORTE%20SUP%20MUEBLE%20GODAI%2063x48.xlsx'
    },
    {
        name: 'Cubo',
        url: 'https://vuiuorjzonpyobpelyld.supabase.co/storage/v1/object/public/HDT/Muebles%20GODAI%20de%2063x48/HOJA%20DE%20RUTA%20CUBO%20MUEBLE%20GODAI%20DE%2063x48.xlsx'
    },
    {
        name: 'Cubo+Cajón',
        url: 'https://vuiuorjzonpyobpelyld.supabase.co/storage/v1/object/public/HDT/Muebles%20GODAI%20de%2063x48/HOJA%20DE%20RUTA%20CUBO%2BCAJON%20MUEBLE%20GODAI%2063x48.xlsx'
    },
    {
        name: 'Mueble',
        url: 'https://vuiuorjzonpyobpelyld.supabase.co/storage/v1/object/public/HDT/Muebles%20GODAI%20de%2063x48/HOJA%20DE%20RUTA%20MUEBLE%20SOPORTE%20SUP%20+%20ESTRUCTURA%20%20GODAI%2063x48.xlsx'
    }
];

const ALLOWED_COLUMNS = ['ancho', 'largo', 'pieza', 'letra'];

export default function PruebaPage() {
    const [selectedFileIndex, setSelectedFileIndex] = useState(0);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAndParseExcel() {
            try {
                setLoading(true);
                const response = await fetch(EXCEL_FILES[selectedFileIndex].url);
                if (!response.ok) throw new Error(`No se pudo descargar el archivo: ${EXCEL_FILES[selectedFileIndex].name}`);

                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Read as raw arrays to find the header row
                const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                // Find the first row that contains at least one of our keywords
                let headerIndex = rawRows.findIndex(row =>
                    row && row.some(cell =>
                        typeof cell === 'string' &&
                        ALLOWED_COLUMNS.some(keyword => cell.toLowerCase().includes(keyword))
                    )
                );

                if (headerIndex === -1) headerIndex = 0; // Fallback

                // Convert to JSON using the found header row
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });
                setData(jsonData);
                setError(null);
            } catch (err: any) {
                console.error('Error processing Excel:', err);
                setError(`Error al leer "${EXCEL_FILES[selectedFileIndex].name}". Por favor verifica la URL.`);
            } finally {
                setLoading(false);
            }
        }

        fetchAndParseExcel();
    }, [selectedFileIndex]);

    const filteredKeys = useMemo(() => {
        if (data.length === 0) return [];
        const allKeys = Object.keys(data[0]);
        return allKeys.filter(key =>
            ALLOWED_COLUMNS.some(allowed => key.toLowerCase().includes(allowed))
        );
    }, [data]);

    return (
        <div className={styles.dashboardContainer}>
            <header className={styles.navbar} style={{ marginBottom: '2rem' }}>
                <div className={styles.logo}>Lectura Filtrada - Hojas de Ruta</div>
                <Link href="/dashboard" className={styles.dashButton}>
                    Volver al Dashboard
                </Link>
            </header>

            <main className={styles.mainContent}>
                <div className={styles.tabContainer}>
                    {EXCEL_FILES.map((file, index) => (
                        <button
                            key={index}
                            className={`${styles.tabButton} ${selectedFileIndex === index ? styles.activeTab : ''}`}
                            onClick={() => setSelectedFileIndex(index)}
                        >
                            {file.name}
                        </button>
                    ))}
                </div>

                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} ${styles.cardIndigo}`}>
                        <h3>{EXCEL_FILES[selectedFileIndex].name}</h3>
                        <div className={styles.statValue}>{loading ? '...' : data.length}</div>
                        <div className={styles.statLabel}>Registros filtrados (Pieza, Letra, Ancho, Largo)</div>
                    </div>
                </div>

                <div className={styles.activityList} style={{ padding: '2rem' }}>
                    {loading ? (
                        <p className={styles.noData}>Cargando datos de {EXCEL_FILES[selectedFileIndex].name}...</p>
                    ) : error ? (
                        <p className={styles.errorMessage}>{error}</p>
                    ) : (
                        <div className={styles.excelTableWrapper}>
                            <table className={styles.excelTable}>
                                <thead>
                                    <tr>
                                        {filteredKeys.map((key) => (
                                            <th key={key}>{key}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, index) => (
                                        <tr key={index}>
                                            {filteredKeys.map((key, i) => (
                                                <td key={i}>{row[key] || '-'}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
