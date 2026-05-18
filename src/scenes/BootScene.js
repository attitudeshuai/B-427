import Phaser from 'phaser';
import { COLORS, PLANTS, ZOMBIES } from '../constants';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.add.text(this.scale.width / 2, this.scale.height / 2, '正在加载全明星阵容...', {
            fontSize: '32px',
            fill: '#ffffff',
            fontFamily: 'ZCOOL KuaiLe'
        }).setOrigin(0.5);

        this.createTextures();

        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }

    createTextures() {
        const draw = (key, width, height, callback) => {
            const g = this.add.graphics();
            callback(g);
            g.generateTexture(key, width, height);
            g.destroy();
        };

        // Sun
        draw('sun', 60, 60, (g) => {
            g.fillStyle(0xffd700, 1);
            g.fillCircle(30, 30, 22);
            g.lineStyle(4, 0xffa500, 1);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                g.lineBetween(
                    30 + Math.cos(angle) * 18, 30 + Math.sin(angle) * 18,
                    30 + Math.cos(angle) * 28, 30 + Math.sin(angle) * 28
                );
            }
        });

        // Pea
        draw('pea', 24, 24, (g) => {
            g.fillStyle(0xCDDC39, 1);
            g.fillCircle(12, 12, 8);
            g.fillStyle(0xffffff, 0.4);
            g.fillCircle(9, 9, 3);
        });

        // Ice Pea
        draw('ice_pea', 24, 24, (g) => {
            g.fillStyle(0x00BCD4, 1);
            g.fillCircle(12, 12, 8);
            g.fillStyle(0xffffff, 0.6);
            g.fillCircle(9, 9, 4);
        });

        // Generate textures for all plants
        Object.entries(PLANTS).forEach(([key, data]) => {
            const name = key.toLowerCase();
            draw(name, 80, 80, (g) => {
                g.fillStyle(data.color, 1);
                // Base shape: common for all
                g.fillEllipse(40, 60, 50, 20); // Base/Pot

                // Specific shapes based on type
                if (data.type.includes('shooter')) {
                    g.fillCircle(40, 35, 25); // Head
                    g.fillRect(55, 30, 25, 10); // Spout
                } else if (data.type === 'producer') {
                    g.fillCircle(40, 35, 28);
                    g.fillStyle(0xffa500, 1); // Petals
                    for (let i = 0; i < 8; i++) {
                        const ang = (i / 8) * Math.PI * 2;
                        g.fillCircle(40 + Math.cos(ang) * 20, 35 + Math.sin(ang) * 20, 8);
                    }
                } else if (data.type === 'wall') {
                    g.fillRoundedRect(15, 10, 50, 60, 20);
                } else if (data.type.includes('explosive')) {
                    g.fillCircle(30, 45, 20);
                    g.fillCircle(50, 45, 20);
                    g.fillStyle(0x000000, 1);
                    g.fillRect(38, 20, 4, 15); // Stem
                } else {
                    g.fillCircle(40, 35, 30);
                }

                // Eyes
                g.fillStyle(0x000000, 1);
                g.fillCircle(35, 30, 3);
                g.fillCircle(45, 30, 3);
            });
        });

        // Generate textures for all zombies
        Object.entries(ZOMBIES).forEach(([key, data]) => {
            const name = key.toLowerCase();
            draw(name, 80, 100, (g) => {
                // Leg/Body
                g.fillStyle(0x424242, 1);
                g.fillRect(30, 60, 25, 35);

                // Torso
                g.fillStyle(data.color, 1);
                g.fillRect(25, 35, 35, 30);

                // Head
                g.fillStyle(0x8bc34a, 1);
                g.fillCircle(42, 25, 20);

                // Special accessories
                if (key === 'CONEHEAD') {
                    g.fillStyle(0xff9800, 1);
                    g.fillTriangle(25, 20, 59, 20, 42, -10);
                } else if (key === 'BUCKETHEAD') {
                    g.fillStyle(0x9e9e9e, 1);
                    g.fillRect(25, 5, 34, 20);
                } else if (key === 'FOOTBALL') {
                    g.fillStyle(0xf44336, 1);
                    g.fillCircle(42, 20, 24);
                } else if (key === 'SCREEN_DOOR') {
                    g.fillStyle(0xbdbdbd, 1);
                    g.fillRect(10, 30, 25, 50);
                }

                // Eyes
                g.fillStyle(0x000000, 1);
                g.fillCircle(35, 22, 3);
                g.fillCircle(49, 22, 3);
            });
        });
    }
}
