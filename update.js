const fs = require('fs')

async function sync() {
	// Берём URL твоей функции из переменной окружения Гитхаба
	const API_URL = process.env.YANDEX_API_URL

	if (!API_URL) {
		console.error('Ошибка: Переменная YANDEX_API_URL не задана в Secrets!')
		process.exit(1)
	}

	try {
		console.log('Запрос данных из Yandex Cloud...')

		// Вызываем твою функцию с параметром action=getProducts
		const res = await fetch(`${API_URL}?action=getProducts`)

		if (!res.ok) {
			throw new Error(`Ошибка API: ${res.status} ${res.statusText}`)
		}

		const products = await res.json()

		// Сортируем: новые товары всегда будут сверху
		products.sort((a, b) => {
			const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return timeB - timeA
		})

		// Записываем результат в файл products.json
		fs.writeFileSync('products.json', JSON.stringify(products, null, 2))

		console.log(`Успешно! Синхронизировано товаров: ${products.length}`)
	} catch (e) {
		console.error('Синхронизация провалилась:', e)
		process.exit(1)
	}
}

sync()
