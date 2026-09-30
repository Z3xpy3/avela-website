"""Единые демонстрационные тарифы. Сервер не доверяет сумме из браузера."""
SERVICES = ['Строительство домов', 'Архитектура и проектирование', 'Отделка и интерьер', 'Инженерные системы', 'Благоустройство']
RATES = {'shell': 65000, 'white': 85000, 'turnkey': 110000}
PACKAGES = {'shell': 'Тёплый контур', 'white': 'Предчистовая', 'turnkey': 'Под ключ'}
MATERIALS = {'aerated': ('Газобетон', 1), 'brick': ('Кирпич', 1.15), 'timber': ('Дерево', 1.08), 'frame': ('Каркас', .9), 'other': ('Другой материал', 1)}
EXTRAS = {'design': ('Дизайн интерьера', 3000, 'area'), 'landscape': ('Ландшафтный проект', 150000, 'fixed'), 'lawn': ('Газон', 800, 'lawn_area'), 'terrace': ('Терраса', 25000, 'terrace_area'), 'gazebo': ('Беседка', 350000, 'fixed'), 'lighting': ('Освещение участка', 120000, 'fixed')}

def number(value, low, high, title):
    try:
        v = float(value)
    except (ValueError, TypeError):
        raise ValueError(f'Проверьте поле «{title}».')
    import math
    if not math.isfinite(v) or not low <= v <= high:
        raise ValueError(f'{title}: допустимо от {low} до {high}.')
    return v

def calculate(raw):
    if not isinstance(raw, dict):
        raise ValueError('Некорректные параметры калькулятора.')
    area = number(raw.get('area', 180), 30, 3000, 'Площадь дома')
    floor_value = number(raw.get('floors', 1), 1, 4, 'Этажность')
    if floor_value != int(floor_value):
        raise ValueError('Укажите целое число этажей.')
    floors = int(floor_value)
    material, package = raw.get('material', 'aerated'), raw.get('package', 'turnkey')
    if material not in MATERIALS or package not in RATES:
        raise ValueError('Выберите материал и комплектацию из списка.')
    extras = raw.get('extras', [])
    if not isinstance(extras, list) or any(x not in EXTRAS for x in extras):
        raise ValueError('Неизвестная дополнительная работа.')
    extras = list(dict.fromkeys(extras))
    lawn = number(raw.get('lawn_area', 100), 1, 20000, 'Площадь газона')
    terrace = number(raw.get('terrace_area', 20), 1, 1000, 'Площадь террасы')
    base = round(area * RATES[package] * MATERIALS[material][1] * {1: 1, 2: 1.05, 3: 1.1,4: 1.15}[floors])
    lines = [{'name': 'Дом · ' + PACKAGES[package], 'price': base}]
    for code in extras:
        title, rate, unit = EXTRAS[code]
        units = {'area': area, 'fixed': 1, 'lawn_area': lawn, 'terrace_area': terrace}[unit]
        lines.append({'name': title, 'price': round(rate * units)})
    quotes = []
    if raw.get('greenery') is True:
        quotes.append('Деревья и озеленение')
    if raw.get('engineering') is True:
        quotes.append('Инженерные системы: уточнить состав и исключить дублирование комплектации')
    if material == 'other':
        quotes.append('Другой материал: уточнить технологию')
    return {'area': area, 'floors': floors, 'material': material, 'package': package, 'extras': extras, 'lawn_area': lawn, 'terrace_area': terrace, 'greenery': raw.get('greenery') is True, 'engineering': raw.get('engineering') is True, 'lines': lines, 'on_request': quotes, 'total': sum(x['price'] for x in lines), 'preliminary': True}
