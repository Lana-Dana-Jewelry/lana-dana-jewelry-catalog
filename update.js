const fs = require('fs')

async function sync() {
	const PROJECT_ID = process.env.FIREBASE_PROJECT_ID
	const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/products`

	try {
		const res = await fetch(url)
		const data = await res.json()

		const unwrap = val => {
			if (!val) return null
			if (val.stringValue !== undefined) return val.stringValue
			if (val.integerValue !== undefined) return Number(val.integerValue)
			if (val.doubleValue !== undefined) return Number(val.doubleValue)
			if (val.booleanValue !== undefined) return val.booleanValue
			if (val.timestampValue !== undefined) return val.timestampValue
			if (val.arrayValue !== undefined)
				return (val.arrayValue.values || []).map(v => unwrap(v))
			if (val.mapValue !== undefined) {
				const obj = {}
				for (let k in val.mapValue.fields)
					obj[k] = unwrap(val.mapValue.fields[k])
				return obj
			}
			return null
		}

		const products = (data.documents || [])
			.map(doc => {
				const item = { id: doc.name.split('/').pop() }
				for (let key in doc.fields) item[key] = unwrap(doc.fields[key])
				return item
			})
			.filter(p => p.isActive !== false)

		// Сортировка: новые сверху
		products.sort((a, b) => {
			const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return timeB - timeA
		})

		fs.writeFileSync('products.json', JSON.stringify(products, null, 2))
		console.log('Successfully synced ' + products.length + ' products')
	} catch (e) {
		console.error('Sync failed', e)
		process.exit(1)
	}
}

sync()
