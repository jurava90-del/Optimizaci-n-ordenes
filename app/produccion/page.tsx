import { useState, useMemo, useEffect } from 'react'
import styles from './produccion.module.css'
import { getOrdenesFabricacion, type OrdenFabricacion } from '@/lib/services/productionService'

export default function ProduccionDashboard() {
    const [data, setData] = useState<OrdenFabricacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                const orders = await getOrdenesFabricacion();
                setData(orders);
                setError(null);
            } catch (err) {
                setError('Error al cargar las órdenes de fabricación');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Filter States - Default to "All"
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [selectedDay, setSelectedDay] = useState('All');

    // Filtered Traceability Table Data
    const filteredTraceability = useMemo(() => {
        return data.filter(item => {
            const date = new Date(item.created_at);
            const yearMatch = selectedYear === 'All' || date.getFullYear().toString() === selectedYear;
            const monthMatch = selectedMonth === 'All' || (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
            const dayMatch = selectedDay === 'All' || date.getDate().toString().padStart(2, '0') === selectedDay;
            return yearMatch && monthMatch && dayMatch;
        });
    }, [data, selectedYear, selectedMonth, selectedDay]);

    if (loading) {
        return <div className={styles.productionWrapper}><div className={styles.container}><p>Cargando órdenes...</p></div></div>;
    }

    if (error) {
        return <div className={styles.productionWrapper}><div className={styles.container}><p className={styles.errorMessage}>{error}</p></div></div>;
    }

    return (
        <div className={styles.productionWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>Gestión de Órdenes de Fabricación</h1>
                    <p>Monitoreo en tiempo real de la producción desde Supabase.</p>
                </header>

                {/* Main Dashboard Content */}
                <div className={styles.mainGridFull}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>Listado de Órdenes de Fabricación Muebles</h2>
                        </div>

                        <div className={styles.filters}>
                            <select
                                className={styles.filterSelect}
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                            >
                                <option value="All">Año: Todos</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>

                            <select
                                className={styles.filterSelect}
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                            >
                                <option value="All">Mes: Todos</option>
                                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>

                            <select
                                className={styles.filterSelect}
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                            >
                                <option value="All">Día: Todos</option>
                                {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(day => (
                                    <option key={day} value={day}>{day}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>OF / Pedido</th>
                                        <th>Producto / Descripción</th>
                                        <th>Cant.</th>
                                        <th>Planta</th>
                                        <th>Entrega Est.</th>
                                        <th>Estado</th>
                                        <th>Componentes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTraceability.length > 0 ? (
                                        filteredTraceability.map((item) => (
                                            <tr key={item.id}>
                                                <td>
                                                    <strong>{item.orden_fabricacion}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.numero_pedido || 'N/A'}</div>
                                                </td>
                                                <td>
                                                    <div className={styles.skuBadge}>{item.producto_sku}</div>
                                                    <div className={styles.productDesc}>{item.producto_descripcion}</div>
                                                </td>
                                                <td>{item.cantidad}</td>
                                                <td><span className={styles.plantBadge}>{item.planta}</span></td>
                                                <td>{new Date(item.fecha_entrega_estimada).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${item.pendiente ? styles.statusPending : styles.statusDone}`}>
                                                        {item.pendiente ? 'Pendiente' : 'Finalizado'}
                                                    </span>
                                                    {item.ensayo && <div className={styles.ensayoLabel}>🧪 Ensayo</div>}
                                                </td>
                                                <td>
                                                    <details className={styles.jsonDetails}>
                                                        <summary>Ver JSON</summary>
                                                        <pre>{JSON.stringify(item.componentes, null, 2)}</pre>
                                                    </details>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                                No hay órdenes para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

