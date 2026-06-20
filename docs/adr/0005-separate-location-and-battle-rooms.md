# Separate Location and Battle Rooms

Status: accepted

GameIt Monsters keeps map presence and combat simulation in separate Colyseus room types. Location Rooms own map presence, movement, transitions, interaction claims, and `inBattle` visibility; Battle Rooms own deterministic battle ticks, Attack intents, Fatigue, HP, disconnect grace, rewards, and exit results. This boundary keeps movement and combat state independently testable and prevents map rooms from becoming broad game-engine rooms.

