Rasmlarni shu papkaga qo'shing, nomlari aniq shunday bo'lishi kerak
(yoki components/speaking-demo.tsx ichidagi VISUALS ro'yxatida yo'llarni
o'zingiz xohlagan nomga/URLga almashtiring):

- driving.jpg          (1.2-qism, 4-6 savollar — haydovchi surati)
- crosswalk.jpg         (1.2-qism, 4-6 savollar — piyodalar surati)
- feet-arrows.jpg        (2-qism — oyoq va strelkalar surati)

Muqobil variant: fayl yuklash o'rniga to'g'ridan-to'g'ri tashqi URL
(https://...) yozishingiz ham mumkin — VISUALS ro'yxatidagi "src"
qiymatini shunchaki almashtiring, masalan:

  { src: "https://example.com/driving.jpg", alt: "..." }

Agar rasm topilmasa (fayl yo'q yoki URL noto'g'ri), sahifa xato bermaydi —
o'rniga "Rasm topilmadi" degan bildirishnoma ko'rsatiladi.
