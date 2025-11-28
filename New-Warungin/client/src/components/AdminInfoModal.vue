<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    @click.self="close"
  >
    <div class="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold mb-1">Informasi Penting</h2>
            <p class="text-blue-100 text-sm">Pelajari tentang langganan, addons, dan cara penggunaannya</p>
          </div>
          <button
            @click="close"
            class="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <!-- Card 0: Tutorial Penggunaan -->
        <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <button
            @click="toggleCard('tutorial')"
            class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 transition-all"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-gray-900">📚 Tutorial Penggunaan</h3>
                <p class="text-sm text-gray-600">Panduan lengkap untuk memulai dan menggunakan sistem</p>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-gray-600 transition-transform"
              :class="{ 'rotate-180': expandedCard === 'tutorial' }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="expandedCard === 'tutorial'"
            class="p-4 bg-white border-t border-gray-200"
          >
            <div class="space-y-6 text-sm text-gray-700">
              <!-- Setup Awal Toko -->
              <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 class="font-bold text-blue-900 mb-3 text-base flex items-center">
                  <span class="mr-2">🚀</span>
                  Langkah 1: Setup Awal Toko
                </h4>
                <ol class="list-decimal list-inside space-y-2 ml-2 text-gray-700">
                  <li><strong>Lengkapi Profil Toko:</strong> Klik menu <strong>Pengaturan Toko</strong> → Isi nama toko, alamat, nomor telepon, dan informasi penting lainnya</li>
                  <li><strong>Atur Outlet/Store:</strong> Jika memiliki beberapa cabang, tambahkan outlet di menu <strong>Store</strong> → Klik tombol <strong>Tambah Store</strong></li>
                  <li><strong>Konfigurasi Struk:</strong> Di halaman <strong>Pengaturan Toko</strong>, scroll ke bagian <strong>Template Struk</strong> → Pilih template yang sesuai atau kustomisasi sesuai kebutuhan</li>
                  <li><strong>Setup Metode Pembayaran:</strong> Pastikan metode pembayaran yang digunakan sudah dikonfigurasi (Cash, QRIS, Transfer Bank, dll)</li>
                </ol>
              </div>

              <!-- Atur User -->
              <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 class="font-bold text-purple-900 mb-3 text-base flex items-center">
                  <span class="mr-2">👥</span>
                  Langkah 2: Atur User & Tim
                </h4>
                <ol class="list-decimal list-inside space-y-2 ml-2 text-gray-700">
                  <li><strong>Buka Menu User:</strong> Klik menu <strong>User</strong> di sidebar untuk melihat daftar user yang sudah ada</li>
                  <li><strong>Tambah User Baru:</strong> Klik tombol <strong>Tambah User</strong> → Isi nama, email, pilih role (Kasir, Dapur, atau SPV) → Sistem akan generate password default</li>
                  <li><strong>Atur Permission:</strong> Untuk user dengan role Supervisor atau Kasir, Anda bisa atur permission khusus di menu edit user (misalnya: izin edit order, hapus order, dll)</li>
                  <li><strong>Distribusikan Akses:</strong> Berikan email dan password default ke masing-masing user → Minta mereka login dan ganti password di menu <strong>Pengaturan</strong> → <strong>Password</strong></li>
                  <li><strong>Aktifkan/Nonaktifkan User:</strong> Gunakan toggle <strong>Status</strong> untuk mengaktifkan atau menonaktifkan akses user tanpa menghapus data mereka</li>
                </ol>
              </div>

              <!-- Menu Admin Tenant -->
              <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 class="font-bold text-green-900 mb-3 text-base flex items-center">
                  <span class="mr-2">👑</span>
                  Menu Admin Tenant - Kontrol Penuh Sistem
                </h4>
                <div class="space-y-3 ml-2">
                  <div>
                    <strong class="text-green-800">📊 Dashboard:</strong>
                    <p class="text-gray-700 mt-1">Lihat ringkasan penjualan hari ini, produk terlaris, grafik penjualan, dan statistik penting lainnya. Quick Insight menampilkan analisis cepat untuk pengambilan keputusan.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">🛍️ Produk:</strong>
                    <p class="text-gray-700 mt-1">Kelola semua produk toko Anda. Tambah produk baru dengan foto, kategori, harga, stok, dan barcode. Edit atau hapus produk yang sudah tidak dijual. Atur alert stok minimum untuk notifikasi otomatis saat stok menipis.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">🛒 POS (Point of Sale):</strong>
                    <p class="text-gray-700 mt-1">Sistem kasir untuk transaksi langsung. Pilih produk, atur jumlah, pilih customer/member, terapkan diskon, dan proses pembayaran. Cetak struk langsung setelah transaksi selesai.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">📋 Pesanan:</strong>
                    <p class="text-gray-700 mt-1">Lihat semua pesanan yang masuk, filter berdasarkan status (Pending, Processing, Completed, Cancelled). Edit pesanan yang belum dibayar, update status, dan kirim ke dapur jika ada item makanan/minuman.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">👥 Pelanggan:</strong>
                    <p class="text-gray-700 mt-1">Kelola data pelanggan dan member. Tambah pelanggan baru, lihat riwayat pembelian, dan kelola member dengan diskon khusus. Member bisa mendapatkan diskon otomatis saat checkout.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">🏪 Store:</strong>
                    <p class="text-gray-700 mt-1">Kelola outlet/cabang toko Anda. Tambah store baru, edit informasi store, atau nonaktifkan store yang sudah tidak beroperasi. Setiap store bisa memiliki produk dan laporan terpisah.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">📈 Laporan:</strong>
                    <p class="text-gray-700 mt-1">Akses berbagai laporan penjualan dan keuangan. Filter berdasarkan tanggal, export ke Excel/PDF, dan analisis performa bisnis. Lihat laporan penjualan harian, bulanan, produk terlaris, dan laporan keuangan.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">📊 Business Analytics:</strong>
                    <p class="text-gray-700 mt-1">Fitur advanced analytics (jika addon aktif) untuk analisis mendalam: prediksi penjualan, tren produk, laporan laba rugi, dan insight bisnis yang lebih detail.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">👤 User:</strong>
                    <p class="text-gray-700 mt-1">Kelola semua user yang memiliki akses ke sistem. Tambah user baru, edit permission, aktifkan/nonaktifkan user, dan reset password jika diperlukan.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">🎫 Diskon:</strong>
                    <p class="text-gray-700 mt-1">Buat aturan diskon otomatis: diskon berdasarkan jumlah pembelian, diskon bundle (beli A+B dapat diskon), atau diskon produk tertentu. Diskon akan otomatis diterapkan saat checkout.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">💳 Berlangganan:</strong>
                    <p class="text-gray-700 mt-1">Kelola paket langganan Anda. Upgrade paket, perpanjang langganan, lihat riwayat pembayaran, dan aktifkan addon tambahan sesuai kebutuhan bisnis.</p>
                  </div>
                  <div>
                    <strong class="text-green-800">⚙️ Pengaturan Toko:</strong>
                    <p class="text-gray-700 mt-1">Konfigurasi lengkap toko: profil toko, template struk, pengaturan printer, metode pembayaran, dan preferensi sistem lainnya.</p>
                  </div>
                </div>
              </div>

              <!-- Menu Kasir -->
              <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 class="font-bold text-yellow-900 mb-3 text-base flex items-center">
                  <span class="mr-2">💰</span>
                  Menu Kasir - Fokus Transaksi & Pelayanan
                </h4>
                <div class="space-y-3 ml-2">
                  <div>
                    <strong class="text-yellow-800">📊 Dashboard:</strong>
                    <p class="text-gray-700 mt-1">Lihat ringkasan penjualan hari ini dan target harian. Monitor transaksi yang sudah diproses dan pendapatan yang sudah terkumpul.</p>
                  </div>
                  <div>
                    <strong class="text-yellow-800">🛒 POS (Point of Sale):</strong>
                    <p class="text-gray-700 mt-1">Menu utama untuk melayani pelanggan. Scan barcode atau pilih produk, atur jumlah, pilih customer/member, terapkan diskon jika ada, pilih metode pembayaran, dan proses transaksi. Cetak struk setelah pembayaran berhasil.</p>
                  </div>
                  <div>
                    <strong class="text-yellow-800">🛍️ Produk:</strong>
                    <p class="text-gray-700 mt-1">Lihat daftar produk yang tersedia, cek stok real-time, dan cari produk dengan cepat. Jika memiliki permission, bisa edit harga atau stok produk.</p>
                  </div>
                  <div>
                    <strong class="text-yellow-800">📋 Pesanan:</strong>
                    <p class="text-gray-700 mt-1">Lihat pesanan yang masuk, filter berdasarkan status. Edit pesanan yang belum dibayar, update status pesanan, dan kirim notifikasi ke dapur jika ada item yang perlu dimasak.</p>
                  </div>
                  <div>
                    <strong class="text-yellow-800">👥 Pelanggan:</strong>
                    <p class="text-gray-700 mt-1">Cari atau tambah pelanggan baru saat transaksi. Lihat riwayat pembelian pelanggan dan cek status member untuk menerapkan diskon otomatis.</p>
                  </div>
                  <div>
                    <strong class="text-yellow-800">📈 Laporan:</strong>
                    <p class="text-gray-700 mt-1">Lihat laporan penjualan harian yang sudah diproses oleh Anda. Filter berdasarkan tanggal untuk melihat performa penjualan.</p>
                  </div>
                </div>
              </div>

              <!-- Menu Dapur -->
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 class="font-bold text-red-900 mb-3 text-base flex items-center">
                  <span class="mr-2">🍳</span>
                  Menu Dapur - Fokus Pesanan Makanan & Minuman
                </h4>
                <div class="space-y-3 ml-2">
                  <div>
                    <strong class="text-red-800">📊 Dashboard:</strong>
                    <p class="text-gray-700 mt-1">Lihat ringkasan pesanan yang perlu diproses hari ini. Monitor jumlah pesanan pending, sedang dimasak, dan sudah selesai.</p>
                  </div>
                  <div>
                    <strong class="text-red-800">🍽️ Pesanan Dapur:</strong>
                    <p class="text-gray-700 mt-1">Menu utama untuk mengelola pesanan makanan/minuman. Lihat semua pesanan yang dikirim ke dapur, update status: <strong>Pending</strong> (baru masuk) → <strong>Processing</strong> (sedang dimasak) → <strong>Ready</strong> (sudah siap diambil). Notifikasi real-time akan muncul saat ada pesanan baru.</p>
                  </div>
                  <div>
                    <strong class="text-red-800">📋 Detail Pesanan:</strong>
                    <p class="text-gray-700 mt-1">Klik pesanan untuk melihat detail lengkap: item apa saja yang perlu dimasak, jumlah, catatan khusus dari pelanggan, dan waktu pesanan masuk. Update status per item jika ada yang sudah selesai lebih dulu.</p>
                  </div>
                  <div>
                    <strong class="text-red-800">🔔 Notifikasi Real-time:</strong>
                    <p class="text-gray-700 mt-1">Sistem akan memberikan notifikasi suara dan visual saat ada pesanan baru yang masuk ke dapur. Pastikan browser tidak di-block untuk notifikasi.</p>
                  </div>
                </div>
              </div>

              <!-- Menu SPV (Supervisor) -->
              <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h4 class="font-bold text-indigo-900 mb-3 text-base flex items-center">
                  <span class="mr-2">👔</span>
                  Menu Supervisor (SPV) - Monitoring & Supervisi
                </h4>
                <div class="space-y-3 ml-2">
                  <div>
                    <strong class="text-indigo-800">📊 Dashboard:</strong>
                    <p class="text-gray-700 mt-1">Lihat overview lengkap operasional toko: penjualan hari ini, produk terlaris, grafik performa, dan statistik penting lainnya untuk monitoring bisnis.</p>
                  </div>
                  <div>
                    <strong class="text-indigo-800">🛍️ Produk:</strong>
                    <p class="text-gray-700 mt-1">Kelola produk dengan akses penuh: tambah, edit, hapus produk, atur stok, update harga, dan kelola kategori. Monitor produk dengan stok menipis dan lakukan restock.</p>
                  </div>
                  <div>
                    <strong class="text-indigo-800">📋 Pesanan:</strong>
                    <p class="text-gray-700 mt-1">Monitor semua pesanan di toko. Filter berdasarkan status, outlet, atau tanggal. Edit pesanan jika diperlukan, update status, cancel pesanan yang dibatalkan, dan pastikan semua pesanan terproses dengan baik.</p>
                  </div>
                  <div>
                    <strong class="text-indigo-800">👥 Pelanggan:</strong>
                    <p class="text-gray-700 mt-1">Kelola data pelanggan dan member. Tambah pelanggan baru, edit informasi, lihat riwayat pembelian, dan kelola member dengan diskon khusus.</p>
                  </div>
                  <div>
                    <strong class="text-indigo-800">📈 Laporan:</strong>
                    <p class="text-gray-700 mt-1">Akses laporan lengkap untuk analisis bisnis. Lihat laporan penjualan harian/bulanan, produk terlaris, laporan keuangan, dan export ke Excel/PDF untuk presentasi atau arsip.</p>
                  </div>
                  <div>
                    <strong class="text-indigo-800">📊 Business Analytics:</strong>
                    <p class="text-gray-700 mt-1">Jika addon aktif, akses advanced analytics untuk analisis mendalam: prediksi penjualan, tren produk, laporan laba rugi, dan insight bisnis yang lebih detail untuk pengambilan keputusan strategis.</p>
                  </div>
                  <div>
                    <strong class="text-indigo-800">🎫 Diskon:</strong>
                    <p class="text-gray-700 mt-1">Buat dan kelola aturan diskon: diskon berdasarkan jumlah pembelian, diskon bundle, atau diskon produk tertentu. Aktifkan/nonaktifkan diskon sesuai kebutuhan promosi.</p>
                  </div>
                </div>
              </div>

              <!-- Tips Penting -->
              <div class="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <h4 class="font-bold text-gray-900 mb-3 text-base flex items-center">
                  <span class="mr-2">💡</span>
                  Tips & Trik Penting
                </h4>
                <ul class="list-disc list-inside space-y-2 ml-2 text-gray-700">
                  <li><strong>Stok Real-time:</strong> Stok produk akan otomatis berkurang saat transaksi selesai. Pastikan selalu cek stok sebelum transaksi besar.</li>
                  <li><strong>Backup Data:</strong> Sistem otomatis melakukan backup harian. Tapi disarankan export laporan penting secara berkala untuk keamanan tambahan.</li>
                  <li><strong>Notifikasi:</strong> Pastikan browser mengizinkan notifikasi untuk mendapatkan alert real-time tentang pesanan baru, stok menipis, dll.</li>
                  <li><strong>Multi-Device:</strong> Sistem bisa diakses dari berbagai device (komputer, tablet, smartphone). Pastikan koneksi internet stabil untuk performa optimal.</li>
                  <li><strong>Training Tim:</strong> Berikan training singkat ke tim tentang menu yang bisa mereka akses sesuai role masing-masing untuk menghindari kebingungan.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 1: Langganan -->
        <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <button
            @click="toggleCard('subscription')"
            class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-gray-900">Paket Langganan</h3>
                <p class="text-sm text-gray-600">Pelajari tentang paket yang tersedia</p>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-gray-600 transition-transform"
              :class="{ 'rotate-180': expandedCard === 'subscription' }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="expandedCard === 'subscription'"
            class="p-4 bg-white border-t border-gray-200"
          >
            <div class="space-y-3 text-sm text-gray-700">
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Paket yang Tersedia:</h4>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li><strong>BASIC</strong> - Rp 200.000/bulan: Fitur dasar untuk UMKM kecil</li>
                  <li><strong>PRO</strong> - Rp 350.000/bulan: Fitur lengkap untuk bisnis menengah</li>
                  <li><strong>ENTERPRISE</strong> - Rp 500.000/bulan: Fitur premium untuk bisnis besar</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Cara Berlangganan:</h4>
                <ol class="list-decimal list-inside space-y-1 ml-2">
                  <li>Kunjungi halaman <strong>Berlangganan</strong> di menu sidebar</li>
                  <li>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</li>
                  <li>Pilih durasi langganan (30, 60, atau 90 hari)</li>
                  <li>Lakukan pembayaran melalui Midtrans</li>
                  <li>Setelah pembayaran berhasil, paket akan aktif otomatis</li>
                </ol>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Fitur Setiap Paket:</h4>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li>Semua paket termasuk manajemen produk, pesanan, dan pelanggan</li>
                  <li>Paket PRO dan ENTERPRISE memiliki limit yang lebih besar</li>
                  <li>Anda bisa upgrade atau extend kapan saja</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Addons -->
        <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <button
            @click="toggleCard('addons')"
            class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-gray-900">Addons</h3>
                <p class="text-sm text-gray-600">Fitur tambahan untuk meningkatkan produktivitas</p>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-gray-600 transition-transform"
              :class="{ 'rotate-180': expandedCard === 'addons' }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="expandedCard === 'addons'"
            class="p-4 bg-white border-t border-gray-200"
          >
            <div class="space-y-3 text-sm text-gray-700">
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Addons yang Tersedia:</h4>
                <ul class="list-disc list-inside space-y-2 ml-2">
                  <li>
                    <strong>Tambah Outlet</strong> - Rp 120.000/bulan: Tambah outlet/store tambahan
                  </li>
                  <li>
                    <strong>Tambah Pengguna</strong> - Rp 50.000/5 pengguna/bulan: Tambah user untuk tim Anda
                  </li>
                  <li>
                    <strong>Tambah Produk</strong> - Rp 30.000/100 produk/bulan: Tambah kapasitas produk
                  </li>
                  <li>
                    <strong>Business Analytics & Insight</strong> - Rp 250.000/bulan: Laporan Laba Rugi, Advanced Analytics, dan Quick Insight
                  </li>
                  <li>
                    <strong>Export Laporan</strong> - Rp 75.000/bulan: Ekspor laporan dalam format Excel, PDF, CSV
                  </li>
                  <li>
                    <strong>Simple Nota Editor</strong> - Rp 50.000/bulan: Kustomisasi tampilan nota/struk
                  </li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Cara Berlangganan Addon:</h4>
                <ol class="list-decimal list-inside space-y-1 ml-2">
                  <li>Kunjungi halaman <strong>Addon</strong> di menu sidebar</li>
                  <li>Pilih addon yang ingin Anda aktifkan</li>
                  <li>Klik tombol <strong>Berlangganan</strong></li>
                  <li>Lakukan pembayaran melalui Midtrans</li>
                  <li>Addon akan aktif setelah pembayaran berhasil</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Penggunaan Addons -->
        <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
          <button
            @click="toggleCard('usage')"
            class="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 transition-all"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-gray-900">Cara Penggunaan Addons</h3>
                <p class="text-sm text-gray-600">Panduan menggunakan fitur addon yang aktif</p>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-gray-600 transition-transform"
              :class="{ 'rotate-180': expandedCard === 'usage' }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            v-if="expandedCard === 'usage'"
            class="p-4 bg-white border-t border-gray-200"
          >
            <div class="space-y-4 text-sm text-gray-700">
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Business Analytics & Insight:</h4>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li>Akses <strong>Laporan Laba Rugi</strong> dari menu sidebar "Business Analytics" → "Laporan Laba Rugi"</li>
                  <li>Lihat <strong>Advanced Analytics</strong> di menu "Business Analytics" → "Advanced Analytics" untuk prediksi penjualan dan analisis tren</li>
                  <li>Pantau <strong>Quick Insight</strong> di halaman Dashboard untuk ringkasan harian transaksi dan produk terlaris</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Export Laporan:</h4>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li>Kunjungi halaman <strong>Laporan</strong> di menu sidebar</li>
                  <li>Pilih jenis laporan yang ingin diekspor (Penjualan atau Keuangan)</li>
                  <li>Klik tombol <strong>Export Laporan</strong> di pojok kanan atas</li>
                  <li>Pilih format (Excel, PDF, atau CSV) dan rentang waktu</li>
                  <li>Klik <strong>Export</strong> untuk mengunduh laporan</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Simple Nota Editor:</h4>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li>Kunjungi halaman <strong>Pengaturan Toko</strong> di menu sidebar</li>
                  <li>Scroll ke bagian <strong>Template Struk</strong></li>
                  <li>Klik tombol <strong>Kelola Template</strong></li>
                  <li>Kustomisasi header, footer, dan field yang ditampilkan</li>
                  <li>Preview sebelum mencetak dan simpan template</li>
                </ul>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 mb-2">Tips:</h4>
                <ul class="list-disc list-inside space-y-1 ml-2">
                  <li>Addon aktif akan muncul di menu sidebar</li>
                  <li>Anda bisa melihat status addon di halaman <strong>Addon</strong></li>
                  <li>Addon akan otomatis nonaktif setelah masa berlaku habis</li>
                  <li>Perpanjang addon sebelum masa berlaku habis untuk kelangsungan layanan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-xl">
        <div class="flex items-center justify-between">
          <label class="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              v-model="dontShowToday"
              class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Jangan tampilkan lagi hari ini</span>
          </label>
          <button
            @click="close"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  dontShowToday: [];
}>();

const expandedCard = ref<string | null>(null);
const dontShowToday = ref(false);

const toggleCard = (card: string) => {
  if (expandedCard.value === card) {
    expandedCard.value = null;
  } else {
    expandedCard.value = card;
  }
};

const close = () => {
  if (dontShowToday.value) {
    emit('dontShowToday');
  }
  emit('close');
};
</script>

