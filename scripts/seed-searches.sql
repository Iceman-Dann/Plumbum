-- Seed realistic search history across US census tracts + European + Canadian entries.
-- US tracts are grouped with 6-9 searches each so they exceed the hotspot
-- threshold (>5 searches in 30 days). Canadian cities are also added with >5 searches.
-- Timestamps are spread across the last 28 days.

INSERT INTO searches (fips, score, lat, lng, city, session_id, created_at) VALUES

-- ── Flint, MI  (tract 26049000601, high lead risk) ────────────────────────
('26049000601', 91, 43.0125, -83.6875, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000001', NOW() - INTERVAL '1 day'),
('26049000601', 89, 43.0118, -83.6862, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000002', NOW() - INTERVAL '2 days'),
('26049000601', 93, 43.0131, -83.6891, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000003', NOW() - INTERVAL '4 days'),
('26049000601', 88, 43.0109, -83.6848, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000004', NOW() - INTERVAL '6 days'),
('26049000601', 92, 43.0140, -83.6905, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000005', NOW() - INTERVAL '9 days'),
('26049000601', 90, 43.0122, -83.6877, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000006', NOW() - INTERVAL '12 days'),
('26049000601', 87, 43.0115, -83.6860, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000007', NOW() - INTERVAL '15 days'),

-- ── Newark, NJ  (tract 34013007400) ──────────────────────────────────────
('34013007400', 87, 40.7260, -74.1458, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000008', NOW() - INTERVAL '1 day'),
('34013007400', 84, 40.7255, -74.1445, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000009', NOW() - INTERVAL '3 days'),
('34013007400', 82, 40.7268, -74.1470, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000010', NOW() - INTERVAL '7 days'),
('34013007400', 85, 40.7248, -74.1435, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000011', NOW() - INTERVAL '11 days'),
('34013007400', 83, 40.7272, -74.1480, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000012', NOW() - INTERVAL '14 days'),
('34013007400', 86, 40.7261, -74.1462, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000013', NOW() - INTERVAL '18 days'),

-- (Additional US city entries omitted for brevity)

-- ── Toronto, ON, Canada (tract CAN00000001) ──────────────────────────────
('CAN00000001', 65, 43.6532, -79.3832, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0001', NOW() - INTERVAL '1 day'),
('CAN00000001', 62, 43.6540, -79.3820, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0002', NOW() - INTERVAL '4 days'),
('CAN00000001', 68, 43.6520, -79.3850, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0003', NOW() - INTERVAL '8 days'),
('CAN00000001', 60, 43.6550, -79.3810, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0004', NOW() - INTERVAL '12 days'),
('CAN00000001', 64, 43.6530, -79.3840, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0005', NOW() - INTERVAL '16 days'),
('CAN00000001', 66, 43.6535, -79.3830, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0006', NOW() - INTERVAL '21 days'),
('CAN00000001', 63, 43.6525, -79.3835, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0007', NOW() - INTERVAL '25 days'),

-- ── Montreal, QC, Canada (tract CAN00000002) ─────────────────────────────
('CAN00000002', 72, 45.5017, -73.5673, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0008', NOW() - INTERVAL '3 days'),
('CAN00000002', 75, 45.5025, -73.5660, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0009', NOW() - INTERVAL '6 days'),
('CAN00000002', 69, 45.5005, -73.5690, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0010', NOW() - INTERVAL '11 days'),
('CAN00000002', 74, 45.5030, -73.5650, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0011', NOW() - INTERVAL '15 days'),
('CAN00000002', 71, 45.5010, -73.5680, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0012', NOW() - INTERVAL '20 days'),
('CAN00000002', 73, 45.5020, -73.5670, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0013', NOW() - INTERVAL '24 days'),
('CAN00000002', 70, 45.5015, -73.5675, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0014', NOW() - INTERVAL '28 days'),

-- ── Vancouver, BC, Canada (tract CAN00000003) ────────────────────────────
('CAN00000003', 38, 49.2827, -123.1207, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0015', NOW() - INTERVAL '2 days'),
('CAN00000003', 41, 49.2835, -123.1190, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0016', NOW() - INTERVAL '7 days'),
('CAN00000003', 35, 49.2815, -123.1220, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0017', NOW() - INTERVAL '11 days'),
('CAN00000003', 40, 49.2840, -123.1180, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0018', NOW() - INTERVAL '15 days'),
('CAN00000003', 37, 49.2820, -123.1210, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0019', NOW() - INTERVAL '19 days'),
('CAN00000003', 39, 49.2830, -123.1200, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0020', NOW() - INTERVAL '23 days'),
('CAN00000003', 36, 49.2825, -123.1205, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0021', NOW() - INTERVAL '27 days'),

-- (Additional European entries omitted for brevity)

-- Set country for Canadian entries
UPDATE searches SET country='ca' WHERE fips LIKE 'CAN%';

-- US tracts are grouped with 6-9 searches each so they exceed the hotspot
-- threshold (>5 searches in 30 days). Canadian cities are also added with >5 searches.
-- Timestamps are spread across the last 28 days.

INSERT INTO searches (fips, score, lat, lng, city, session_id, created_at) VALUES

-- ── Flint, MI  (tract 26049000601, high lead risk) ────────────────────────
('26049000601', 91, 43.0125, -83.6875, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000001', NOW() - INTERVAL '1 day'),
('26049000601', 89, 43.0118, -83.6862, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000002', NOW() - INTERVAL '2 days'),
('26049000601', 93, 43.0131, -83.6891, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000003', NOW() - INTERVAL '4 days'),
('26049000601', 88, 43.0109, -83.6848, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000004', NOW() - INTERVAL '6 days'),
('26049000601', 92, 43.0140, -83.6905, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000005', NOW() - INTERVAL '9 days'),
('26049000601', 90, 43.0122, -83.6877, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000006', NOW() - INTERVAL '12 days'),
('26049000601', 87, 43.0115, -83.6860, 'Flint', 'a1b2c3d4-0001-4000-8000-aabbcc000007', NOW() - INTERVAL '15 days'),

-- ── Newark, NJ  (tract 34013007400) ──────────────────────────────────────
('34013007400', 87, 40.7260, -74.1458, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000008', NOW() - INTERVAL '1 day'),
('34013007400', 84, 40.7255, -74.1445, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000009', NOW() - INTERVAL '3 days'),
('34013007400', 82, 40.7268, -74.1470, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000010', NOW() - INTERVAL '7 days'),
('34013007400', 85, 40.7248, -74.1435, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000011', NOW() - INTERVAL '11 days'),
('34013007400', 83, 40.7272, -74.1480, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000012', NOW() - INTERVAL '14 days'),
('34013007400', 86, 40.7261, -74.1462, 'Newark', 'b2c3d4e5-0002-4000-8000-aabbcc000013', NOW() - INTERVAL '18 days'),

-- ── Detroit, MI  (tract 26163527100) ─────────────────────────────────────
('26163527100', 76, 42.3314, -83.0458, 'Detroit', 'c3d4e5f6-0003-4000-8000-aabbcc000014', NOW() - INTERVAL '2 days'),
('26163527100', 79, 42.3320, -83.0444, 'Detroit', 'c3d4e5f6-0003-4000-8000-aabbcc000015', NOW() - INTERVAL '5 days'),
('26163527100', 74, 42.3308, -83.0471, 'Detroit', 'c3d4e5f6-0003-4000-8000-aabbcc000016', NOW() - INTERVAL '8 days'),
('26163527100', 77, 42.3325, -83.0435, 'Detroit', 'c3d4e5f6-0003-4000-8000-aabbcc000017', NOW() - INTERVAL '13 days'),
('26163527100', 75, 42.3301, -83.0462, 'Detroit', 'c3d4e5f6-0003-4000-8000-aabbcc000018', NOW() - INTERVAL '17 days'),
('26163527100', 78, 42.3318, -83.0449, 'Detroit', 'c3d4e5f6-0003-4000-8000-aabbcc000019', NOW() - INTERVAL '22 days'),

-- ── Chicago, IL — Englewood  (tract 17031836600) ──────────────────────────
('17031836600', 71, 41.7799, -87.6445, 'Chicago', 'd4e5f6a7-0004-4000-8000-aabbcc000020', NOW() - INTERVAL '1 day'),
('17031836600', 68, 41.7809, -87.6432, 'Chicago', 'd4e5f6a7-0004-4000-8000-aabbcc000021', NOW() - INTERVAL '4 days'),
('17031836600', 73, 41.7792, -87.6458, 'Chicago', 'd4e5f6a7-0004-4000-8000-aabbcc000022', NOW() - INTERVAL '10 days'),
('17031836600', 70, 41.7815, -87.6420, 'Chicago', 'd4e5f6a7-0004-4000-8000-aabbcc000023', NOW() - INTERVAL '16 days'),
('17031836600', 72, 41.7801, -87.6440, 'Chicago', 'd4e5f6a7-0004-4000-8000-aabbcc000024', NOW() - INTERVAL '20 days'),
('17031836600', 69, 41.7788, -87.6462, 'Chicago', 'd4e5f6a7-0004-4000-8000-aabbcc000025', NOW() - INTERVAL '25 days'),

-- ── Baltimore, MD  (tract 24510300200) ───────────────────────────────────
('24510300200', 65, 39.2904, -76.6122, 'Baltimore', 'e5f6a7b8-0005-4000-8000-aabbcc000026', NOW() - INTERVAL '3 days'),
('24510300200', 63, 39.2912, -76.6108, 'Baltimore', 'e5f6a7b8-0005-4000-8000-aabbcc000027', NOW() - INTERVAL '8 days'),
('24510300200', 67, 39.2896, -76.6135, 'Baltimore', 'e5f6a7b8-0005-4000-8000-aabbcc000028', NOW() - INTERVAL '14 days'),
('24510300200', 64, 39.2920, -76.6098, 'Baltimore', 'e5f6a7b8-0005-4000-8000-aabbcc000029', NOW() - INTERVAL '20 days'),
('24510300200', 66, 39.2900, -76.6125, 'Baltimore', 'e5f6a7b8-0005-4000-8000-aabbcc000030', NOW() - INTERVAL '26 days'),
('24510300200', 62, 39.2908, -76.6115, 'Baltimore', 'e5f6a7b8-0005-4000-8000-aabbcc000031', NOW() - INTERVAL '28 days'),

-- ── Cleveland, OH  (tract 39035105900) ───────────────────────────────────
('39035105900', 61, 41.4993, -81.6944, 'Cleveland', 'f6a7b8c9-0006-4000-8000-aabbcc000032', NOW() - INTERVAL '2 days'),
('39035105900', 58, 41.5001, -81.6930, 'Cleveland', 'f6a7b8c9-0006-4000-8000-aabbcc000033', NOW() - INTERVAL '6 days'),
('39035105900', 63, 41.4985, -81.6958, 'Cleveland', 'f6a7b8c9-0006-4000-8000-aabbcc000034', NOW() - INTERVAL '11 days'),
('39035105900', 60, 41.5008, -81.6920, 'Cleveland', 'f6a7b8c9-0006-4000-8000-aabbcc000035', NOW() - INTERVAL '17 days'),
('39035105900', 59, 41.4978, -81.6965, 'Cleveland', 'f6a7b8c9-0006-4000-8000-aabbcc000036', NOW() - INTERVAL '23 days'),
('39035105900', 62, 41.4995, -81.6945, 'Cleveland', 'f6a7b8c9-0006-4000-8000-aabbcc000037', NOW() - INTERVAL '27 days'),

-- ── Philadelphia, PA  (tract 42101012100) ────────────────────────────────
('42101012100', 73, 39.9526, -75.1652, 'Philadelphia', 'a7b8c9d0-0007-4000-8000-aabbcc000038', NOW() - INTERVAL '1 day'),
('42101012100', 70, 39.9534, -75.1638, 'Philadelphia', 'a7b8c9d0-0007-4000-8000-aabbcc000039', NOW() - INTERVAL '5 days'),
('42101012100', 75, 39.9518, -75.1665, 'Philadelphia', 'a7b8c9d0-0007-4000-8000-aabbcc000040', NOW() - INTERVAL '9 days'),
('42101012100', 72, 39.9540, -75.1625, 'Philadelphia', 'a7b8c9d0-0007-4000-8000-aabbcc000041', NOW() - INTERVAL '15 days'),
('42101012100', 74, 39.9522, -75.1658, 'Philadelphia', 'a7b8c9d0-0007-4000-8000-aabbcc000042', NOW() - INTERVAL '21 days'),
('42101012100', 71, 39.9530, -75.1644, 'Philadelphia', 'a7b8c9d0-0007-4000-8000-aabbcc000043', NOW() - INTERVAL '27 days'),

-- ── Washington, DC (tract 11001000100) ───────────────────────────────────
('11001000100', 55, 38.9072, -77.0369, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000001', NOW() - INTERVAL '2 days'),
('11001000100', 52, 38.9080, -77.0350, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000002', NOW() - INTERVAL '4 days'),
('11001000100', 58, 38.9065, -77.0380, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000003', NOW() - INTERVAL '8 days'),
('11001000100', 50, 38.9090, -77.0340, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000004', NOW() - INTERVAL '11 days'),
('11001000100', 54, 38.9070, -77.0375, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000005', NOW() - INTERVAL '15 days'),
('11001000100', 56, 38.9085, -77.0360, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000006', NOW() - INTERVAL '19 days'),
('11001000100', 53, 38.9077, -77.0365, 'Washington DC', 'd1e2f3a4-0001-4000-8000-bbccaa000007', NOW() - INTERVAL '22 days'),

-- ── Boston, MA (tract 25025000100) ───────────────────────────────────────
('25025000100', 60, 42.3601, -71.0589, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000008', NOW() - INTERVAL '1 day'),
('25025000100', 64, 42.3610, -71.0570, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000009', NOW() - INTERVAL '5 days'),
('25025000100', 58, 42.3590, -71.0600, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000010', NOW() - INTERVAL '9 days'),
('25025000100', 62, 42.3620, -71.0560, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000011', NOW() - INTERVAL '13 days'),
('25025000100', 65, 42.3605, -71.0580, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000012', NOW() - INTERVAL '18 days'),
('25025000100', 59, 42.3615, -71.0590, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000013', NOW() - INTERVAL '22 days'),
('25025000100', 61, 42.3598, -71.0585, 'Boston', 'e2f3a4b5-0002-4000-8000-bbccaa000014', NOW() - INTERVAL '26 days'),

-- ── Pittsburgh, PA (tract 42003000100) ───────────────────────────────────
('42003000100', 78, 40.4406, -79.9959, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000015', NOW() - INTERVAL '3 days'),
('42003000100', 81, 40.4415, -79.9940, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000016', NOW() - INTERVAL '6 days'),
('42003000100', 75, 40.4395, -79.9975, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000017', NOW() - INTERVAL '10 days'),
('42003000100', 82, 40.4420, -79.9930, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000018', NOW() - INTERVAL '14 days'),
('42003000100', 77, 40.4400, -79.9960, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000019', NOW() - INTERVAL '20 days'),
('42003000100', 80, 40.4410, -79.9950, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000020', NOW() - INTERVAL '24 days'),
('42003000100', 79, 40.4403, -79.9955, 'Pittsburgh', 'f3a4b5c6-0003-4000-8000-bbccaa000021', NOW() - INTERVAL '27 days'),

-- ── Milwaukee, WI (tract 55079000100) ────────────────────────────────────
('55079000100', 82, 43.0389, -87.9065, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000022', NOW() - INTERVAL '2 days'),
('55079000100', 85, 43.0400, -87.9050, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000023', NOW() - INTERVAL '5 days'),
('55079000100', 79, 43.0380, -87.9080, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000024', NOW() - INTERVAL '9 days'),
('55079000100', 84, 43.0410, -87.9040, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000025', NOW() - INTERVAL '13 days'),
('55079000100', 81, 43.0390, -87.9070, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000026', NOW() - INTERVAL '17 days'),
('55079000100', 83, 43.0395, -87.9060, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000027', NOW() - INTERVAL '22 days'),
('55079000100', 80, 43.0405, -87.9055, 'Milwaukee', 'a4b5c6d7-0004-4000-8000-bbccaa000028', NOW() - INTERVAL '26 days'),

-- ── Seattle, WA (tract 53033000100) ──────────────────────────────────────
('53033000100', 35, 47.6062, -122.3321, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000029', NOW() - INTERVAL '1 day'),
('53033000100', 32, 47.6070, -122.3300, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000030', NOW() - INTERVAL '4 days'),
('53033000100', 38, 47.6050, -122.3340, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000031', NOW() - INTERVAL '8 days'),
('53033000100', 30, 47.6080, -122.3290, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000032', NOW() - INTERVAL '12 days'),
('53033000100', 34, 47.6060, -122.3330, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000033', NOW() - INTERVAL '17 days'),
('53033000100', 36, 47.6068, -122.3315, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000034', NOW() - INTERVAL '21 days'),
('53033000100', 33, 47.6055, -122.3325, 'Seattle', 'b5c6d7e8-0005-4000-8000-bbccaa000035', NOW() - INTERVAL '25 days'),

-- ── Los Angeles, CA (tract 06037000100) ──────────────────────────────────
('06037000100', 42, 34.0522, -118.2437, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000036', NOW() - INTERVAL '3 days'),
('06037000100', 45, 34.0530, -118.2420, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000037', NOW() - INTERVAL '7 days'),
('06037000100', 39, 34.0510, -118.2450, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000038', NOW() - INTERVAL '11 days'),
('06037000100', 44, 34.0540, -118.2410, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000039', NOW() - INTERVAL '15 days'),
('06037000100', 41, 34.0520, -118.2440, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000040', NOW() - INTERVAL '19 days'),
('06037000100', 43, 34.0525, -118.2430, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000041', NOW() - INTERVAL '23 days'),
('06037000100', 40, 34.0515, -118.2435, 'Los Angeles', 'c6d7e8f9-0006-4000-8000-bbccaa000042', NOW() - INTERVAL '27 days'),

-- ── Denver, CO (tract 08031000100) ───────────────────────────────────────
('08031000100', 51, 39.7392, -104.9903, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000043', NOW() - INTERVAL '1 day'),
('08031000100', 54, 39.7400, -104.9890, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000044', NOW() - INTERVAL '6 days'),
('08031000100', 48, 39.7380, -104.9920, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000045', NOW() - INTERVAL '10 days'),
('08031000100', 53, 39.7410, -104.9880, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000046', NOW() - INTERVAL '14 days'),
('08031000100', 50, 39.7390, -104.9910, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000047', NOW() - INTERVAL '19 days'),
('08031000100', 52, 39.7395, -104.9900, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000048', NOW() - INTERVAL '23 days'),
('08031000100', 49, 39.7385, -104.9905, 'Denver', 'd7e8f9a0-0007-4000-8000-bbccaa000049', NOW() - INTERVAL '27 days'),

-- ── Austin, TX (tract 48453000100) ───────────────────────────────────────
('48453000100', 32, 30.2672, -97.7431, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000050', NOW() - INTERVAL '2 days'),
('48453000100', 35, 30.2680, -97.7410, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000051', NOW() - INTERVAL '7 days'),
('48453000100', 29, 30.2660, -97.7450, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000052', NOW() - INTERVAL '11 days'),
('48453000100', 34, 30.2690, -97.7400, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000053', NOW() - INTERVAL '16 days'),
('48453000100', 31, 30.2670, -97.7440, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000054', NOW() - INTERVAL '20 days'),
('48453000100', 33, 30.2675, -97.7425, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000055', NOW() - INTERVAL '24 days'),
('48453000100', 30, 30.2665, -97.7435, 'Austin', 'e8f9a0b1-0008-4000-8000-bbccaa000056', NOW() - INTERVAL '28 days'),

-- ── Miami, FL (tract 12086000100) ────────────────────────────────────────
('12086000100', 48, 25.7617, -80.1918, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000057', NOW() - INTERVAL '3 days'),
('12086000100', 51, 25.7630, -80.1900, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000058', NOW() - INTERVAL '8 days'),
('12086000100', 45, 25.7600, -80.1930, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000059', NOW() - INTERVAL '12 days'),
('12086000100', 50, 25.7640, -80.1890, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000060', NOW() - INTERVAL '15 days'),
('12086000100', 47, 25.7610, -80.1920, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000061', NOW() - INTERVAL '19 days'),
('12086000100', 49, 25.7622, -80.1910, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000062', NOW() - INTERVAL '24 days'),
('12086000100', 46, 25.7612, -80.1915, 'Miami', 'f9a0b1c2-0009-4000-8000-bbccaa000063', NOW() - INTERVAL '28 days'),

-- ── New Orleans, LA (tract 22071000100) ──────────────────────────────────
('22071000100', 88, 29.9511, -90.0715, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000064', NOW() - INTERVAL '2 days'),
('22071000100', 91, 29.9520, -90.0700, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000065', NOW() - INTERVAL '6 days'),
('22071000100', 86, 29.9500, -90.0730, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000066', NOW() - INTERVAL '11 days'),
('22071000100', 90, 29.9530, -90.0690, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000067', NOW() - INTERVAL '15 days'),
('22071000100', 87, 29.9510, -90.0720, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000068', NOW() - INTERVAL '20 days'),
('22071000100', 89, 29.9515, -90.0710, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000069', NOW() - INTERVAL '24 days'),
('22071000100', 85, 29.9505, -90.0718, 'New Orleans', 'a0b1c2d3-0010-4000-8000-bbccaa000070', NOW() - INTERVAL '27 days'),

-- ── Toronto, ON, Canada (tract CAN00000001) ──────────────────────────────
('CAN00000001', 65, 43.6532, -79.3832, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0001', NOW() - INTERVAL '1 day'),
('CAN00000001', 62, 43.6540, -79.3820, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0002', NOW() - INTERVAL '4 days'),
('CAN00000001', 68, 43.6520, -79.3850, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0003', NOW() - INTERVAL '8 days'),
('CAN00000001', 60, 43.6550, -79.3810, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0004', NOW() - INTERVAL '12 days'),
('CAN00000001', 64, 43.6530, -79.3840, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0005', NOW() - INTERVAL '16 days'),
('CAN00000001', 66, 43.6535, -79.3830, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0006', NOW() - INTERVAL '21 days'),
('CAN00000001', 63, 43.6525, -79.3835, 'Toronto', 'c1d2e3f4-0001-4000-8000-ccddeeff0007', NOW() - INTERVAL '25 days'),

-- ── Montreal, QC, Canada (tract CAN00000002) ─────────────────────────────
('CAN00000002', 72, 45.5017, -73.5673, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0008', NOW() - INTERVAL '3 days'),
('CAN00000002', 75, 45.5025, -73.5660, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0009', NOW() - INTERVAL '6 days'),
('CAN00000002', 69, 45.5005, -73.5690, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0010', NOW() - INTERVAL '11 days'),
('CAN00000002', 74, 45.5030, -73.5650, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0011', NOW() - INTERVAL '15 days'),
('CAN00000002', 71, 45.5010, -73.5680, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0012', NOW() - INTERVAL '20 days'),
('CAN00000002', 73, 45.5020, -73.5670, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0013', NOW() - INTERVAL '24 days'),
('CAN00000002', 70, 45.5015, -73.5675, 'Montreal', 'd2e3f4a5-0002-4000-8000-ccddeeff0014', NOW() - INTERVAL '28 days'),

-- ── Vancouver, BC, Canada (tract CAN00000003) ────────────────────────────
('CAN00000003', 38, 49.2827, -123.1207, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0015', NOW() - INTERVAL '2 days'),
('CAN00000003', 41, 49.2835, -123.1190, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0016', NOW() - INTERVAL '7 days'),
('CAN00000003', 35, 49.2815, -123.1220, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0017', NOW() - INTERVAL '11 days'),
('CAN00000003', 40, 49.2840, -123.1180, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0018', NOW() - INTERVAL '15 days'),
('CAN00000003', 37, 49.2820, -123.1210, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0019', NOW() - INTERVAL '19 days'),
('CAN00000003', 39, 49.2830, -123.1200, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0020', NOW() - INTERVAL '23 days'),
('CAN00000003', 36, 49.2825, -123.1205, 'Vancouver', 'e3f4a5b6-0003-4000-8000-ccddeeff0021', NOW() - INTERVAL '27 days'),

-- ── European researchers / expats checking US properties ─────────────────
('36061007600', 57, 40.7484, -73.9857, 'London',     'b8c9d0e1-0008-4000-8000-aabbcc000044', NOW() - INTERVAL '1 day'),
('36061009800', 48, 40.7580, -73.9855, 'Paris',      'c9d0e1f2-0009-4000-8000-aabbcc000045', NOW() - INTERVAL '3 days'),
('26163527300', 69, 42.3400, -83.0500, 'Berlin',     'd0e1f2a3-0010-4000-8000-aabbcc000046', NOW() - INTERVAL '5 days'),
('17031836800', 66, 41.7850, -87.6480, 'Amsterdam',  'e1f2a3b4-0011-4000-8000-aabbcc000047', NOW() - INTERVAL '8 days'),
('42101015200', 44, 39.9620, -75.1580, 'Brussels',   'f2a3b4c5-0012-4000-8000-aabbcc000048', NOW() - INTERVAL '12 days'),
('34013007200', 80, 40.7310, -74.1720, 'Stockholm',  'a3b4c5d6-0013-4000-8000-aabbcc000049', NOW() - INTERVAL '15 days'),
('39035105700', 55, 41.5100, -81.6800, 'Copenhagen', 'b4c5d6e7-0014-4000-8000-aabbcc000050', NOW() - INTERVAL '18 days'),
('34013007100', 83, 40.7220, -74.1550, 'Zurich',     'c5d6e7f8-0015-4000-8000-aabbcc000051', NOW() - INTERVAL '21 days'),
('26049000700', 77, 43.0200, -83.6750, 'Dublin',     'd6e7f8a9-0016-4000-8000-aabbcc000052', NOW() - INTERVAL '23 days'),
('24510270200', 59, 39.3100, -76.6250, 'Rome',       'e7f8a9b0-0017-4000-8000-aabbcc000053', NOW() - INTERVAL '26 days');
