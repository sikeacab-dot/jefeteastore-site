var products = [
    {
        "id": 5,
        "name": "Пуер \"Менхай\"",
        "category": "Puerh",
        "price": 275,
        "variants": {
            "50": 150,
            "100": 275,
            "357": 500
        },
        "images": [
            "assets/products/prod_5_0.webp",
            "assets/products/prod_5_1.webp",
            "assets/products/prod_5_2.webp"
        ],
        "image": "assets/products/image_1.webp",
        "origin": "Юньнань, Китай",
        "description": "Класичний витриманий шу пуер у формі млинця. Не надто гіркий, із землянистими нотами, деревними відтінками та легкою солодкістю.\n\nЧай для тепла, спокою та м’якої концентрації.",
        "on_order": false,
        "badge": "none",
        "brewing": {
            "steeps": 6,
            "time": 20,
            "grams": 8
        }
    },
    {
        "id": 3,
        "name": "Да Хун Пао (пачки)",
        "category": "Oolong",
        "price": 250,
        "variants": {
            "100": 250,
            "200": 450
        },
        "images": [
            "assets/products/prod_3_0.webp",
            "assets/products/prod_3_1.webp"
        ],
        "image": "assets/products/image_2.webp",
        "origin": "Уїшань, Китай",
        "description": "Класичний високоякісний Да Хун Пао у порційних пачках. Збалансований, чистий смак із нотами карамелі, легкої деревини та кам’янистої мінеральності. Аромат глибокий, післясмак довгий та теплий.\n\nЧай для тонусу, концентрації та яскравих смакових відчуттів.",
        "on_order": false,
        "badge": "none",
        "brewing": {
            "steeps": 7,
            "time": 15,
            "grams": 7
        }
    },
    {
        "id": 4,
        "name": "Ті Гуань Інь",
        "category": "Oolong",
        "price": 250,
        "variants": {
            "100": 250,
            "200": 450
        },
        "images": [
            "assets/products/prod_4_0.webp",
            "assets/products/prod_4_1.webp"
        ],
        "image": "assets/products/image_3.webp",
        "origin": "Фуцзянь, Китай",
        "description": "Високогірний улун із квітковим ароматом, м’якою вершковістю та солодким післясмаком. Красиве скручене листя розкривається у великі пластини.\n\nЧай для легкості, гармонії та приємного релаксу.",
        "on_order": false,
        "badge": "none",
        "brewing": {
            "steeps": 5,
            "time": 20,
            "grams": 7
        }
    },
    {
        "id": 1771117657775,
        "name": "Смола Пуеру \"Ча Гао\"",
        "category": "Puerh",
        "price": 200,
        "variants": null,
        "images": [
            "assets/products/prod_1771117657775_0.webp"
        ],
        "image": "assets/products/image_4.webp",
        "origin": "Юньнань, Китай",
        "description": "Концентрований екстракт пуеру з дуже насиченим, «ядерним» смаком. Глибокі ноти темного пуеру, щільність та інтенсивність у кожному ковтку.\n\nЧай для тонусу, концентрації та швидкого ефекту.\n\nЦіна вказана за 50 шт.",
        "on_order": false,
        "badge": "none",
        "brewing": {
            "steeps": 2,
            "time": 30,
            "grams": 1
        }
    },
    {
        "id": 6,
        "name": "Да Хун Пао",
        "category": "Oolong",
        "price": 350,
        "variants": {
            "50": 200,
            "100": 350
        },
        "images": [
            "assets/products/prod_6_0.webp"
        ],
        "image": "assets/products/image_5.webp",
        "origin": "Уїшань, Китай",
        "description": "Легендарний улун із скельним характером та глибоким ароматом. Має дуже яскравий, насичений смак із нотами пряності, з відтінками деревини, смажених горіхів і печеного каштана,  та довгим солодкуватим післясмаком.\n\nЧай для тонусу, концентрації та яскравих смакових відчуттів.",
        "on_order": false,
        "badge": "none",
        "brewing": {
            "steeps": 6,
            "time": 15,
            "grams": 8
        }
    },
    {
        "id": 2,
        "name": "Червоний Дракон Пуер",
        "category": "Puerh",
        "price": 250,
        "variants": {
            "50": 150,
            "100": 250,
            "250": 450
        },
        "images": [
            "assets/products/prod_2_0.webp",
            "assets/products/prod_2_1.webp"
        ],
        "image": "assets/products/image_6.webp",
        "origin": "Юньнань, Китай",
        "description": "Класичний шу без різкої гіркоти. Ноти вологого лісу, темного дерева та легкої горіхової ноти.\n\nЧай для бадьорості, світлості думок та більшої концентрації.",
        "on_order": false,
        "badge": "none",
        "brewing": {
            "steeps": 6,
            "time": 15,
            "grams": 7
        }
    },
    {
        "id": 1,
        "name": "Габа \"King Gaba\"",
        "category": "Gaba",
        "price": 500,
        "variants": {
            "50": 275,
            "100": 500
        },
        "images": [
            "assets/products/prod_1_0.webp"
        ],
        "image": "assets/products/image_7.webp",
        "origin": "Тайвань",
        "description": "Преміальний улун, ферментований для збагачення ГАМК. Солодкуватий фруктово-медовий смак із карамельною нотою.\n\nЧай для розслаблення, спокою та ясності мислення.",
        "on_order": true,
        "badge": "none",
        "brewing": {
            "steeps": 7,
            "time": 15,
            "grams": 7
        }
    }
];