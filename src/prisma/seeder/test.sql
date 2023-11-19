USE db;

INSERT INTO restaurants 
(name, description, image) 
VALUES 
('Muy Gringo', 
"Um lugar para reunir as pessoas que a gente gosta, conversar, se divertir, ouvir boa música, brindar e comemorar. Este é um conceito inspirado nos restaurantes americanos conhecidos como 'Food Joints'.", 
'https://smartmenuapi.nntech.online/images/muygringo/cover2.jpg'),
('Tambaqui de Banda', 
'Simples, genuíno e autêntico, é a maneira como melhor expressamos tudo que é original e representativo de uma cultura rica em diversas dimensões.', 
'https://smartmenuapi.nntech.online/images/tambaquidebanda/cover.jpg');


INSERT INTO products  
(name, description, price, image, restaurant_id) 
VALUES 
(
'HOT TOAST',
'Pão brioche de hot dog tostado,
linguicinha defumada e mix
de queijo muçarela e cheddar
derretido.',
2700,
'https://smartmenuapi.nntech.online/images/muygringo/hottoast.jpg',
1
),
(
'DOGGY LOVE',
'Pão brioche de hot dog,
linguicinha defumada, provolone,
bacon, cebola caramelizada,
molho BBQ e molho aioli.',
3100,
'https://smartmenuapi.nntech.online/images/muygringo/doggylove.jpg',
1
),
(
'CHICADO DOG',
'Pão brioche de hot dog,
linguicinha defumada, tomate,
cebola, picles, molho aioli e
mostarda.',
3000,
'https://smartmenuapi.nntech.online/images/muygringo/chicadodog.jpg',
1
),
(
'ABACON ULTRASMASH',
'2 carnes ultrasmash de 50g,
pão brioche, queijo muçarela,
cebola caramelizada, molho BBQ,
alface, tomate, abacaxi grelhado,
bacon e maionese aioli.',
2990,
'https://smartmenuapi.nntech.online/images/muygringo/abaconultrasmash.jpg',
1
),
(
'ULTRASMASH STONES',
'2 carnes ultrasmash de 50g,
pão brioche, queijo muçarela,
molho BBQ, alface, tomate,
bacon onion rings, maionese aioli.',
2990,
'https://smartmenuapi.nntech.online/images/muygringo/ultrasmashstones.jpg',
1
),
(
'ULTRASMASH CHEESE',
'2 carnes ultrasmash de 50g,
queijo muçarela, maionese e
ketchup.',
2990,
'https://smartmenuapi.nntech.online/images/muygringo/ultrasmashcheese.jpg',
1
),
(
'ULTRASMASH SALAD',
'2 carnes ultrasmash de 50g,
pão brioche, queijo muçarela,
maionese aioli, ovo, tomate e
alface',
2990,
'https://smartmenuapi.nntech.online/images/muygringo/ultrasmashsalad.jpg',
1
),
(
'Combinado Amazonense',
'Lascas de pirarucu seco assado na brasa',
2990,
'https://smartmenuapi.nntech.online/images/tambaquidebanda/combinadoamazonense.jpg',
2
),
(
'Costela de Tambaqui',
'Baião de dois ou arroz, farofa e vinagrete',
6990,
'https://smartmenuapi.nntech.online/images/tambaquidebanda/costeladetambaqui.jpg',
2
),
(
'Filé Mignon Acebolado',
'Arroz, farofa e batata frita ou purê',
4990,
'https://smartmenuapi.nntech.online/images/tambaquidebanda/filemignonacebolado.jpg',
2
),
(
'Jaraqui Frito',
'Acompanha baião de dois ou arroz, farofa e vinagrete',
4990,
'https://smartmenuapi.nntech.online/images/tambaquidebanda/jaraquifrito.jpg',
2
),
(
'Moqueca Caboca',
'Vencedor do Festival Brasil Sabor',
7990,
'https://smartmenuapi.nntech.online/images/tambaquidebanda/moquecacaboca.jpg',
2
);

INSERT INTO tables
(restaurant_id, enter_code, number)
VALUES
(1, 'CODE1', 1),
(1, 'CODE2', 2),
(1, 'CODE3', 3),
(1, 'CODE4', 4),
(2, 'CODE5', 1),
(2, 'CODE6', 2),
(2, 'CODE7', 3),
(2, 'CODE8', 4);

INSERT INTO officials 
(name, email, password, restaurant_id, image_id)
VALUES
('Nelson', 'nelson@icomp.com', '123456', 1, 3),
('Keren', 'keren@icomp.com', '123456', 2, 8);
