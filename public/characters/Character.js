class Character {
  constructor(type) {
    this.type = type;

    if (type === 'vexa') {
      this.health = 100;
      this.damage = 10;
      this.speed = 5;
      this.attacks = {
        basic: 12,
        special: 25,
        ult: 70,
      };
      this.knockbacks = {
        basic: 5,
        special: 10,
        ult: 20,
      }
    } else if (type === 'glyph') {
      this.health = 80;
      this.damage = 15;
      this.speed = 4;
      this.attacks = {
        basic: 4,
        special: 45,
        ult: 80,
      };
      this.knockbacks = {
        basic: 2,
        special: 6,
        ult: 12,
      }
    }
  }
}

module.exports = Character;
