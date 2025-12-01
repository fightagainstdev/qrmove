/** This file is part of Super Castle Game.
 * https://github.com/mvasilkov/super2023
 * @license GPLv3 | Copyright (c) 2023 Mark Vasilkov
 */
'use strict'

import { easeInOutQuad } from '../node_modules/natlib/interpolation.js'
import { con, oscillate, wrapAround } from './setup.js'

export function printCenter(x0: number, y0: number, scale: number, text: string, effectStrength = 0, t = 0) {
    // Modern font rendering using Canvas text
    con.save()
    
    // Set font properties for bright, theme-appropriate typography
    const fontSize = Math.floor(scale * 24) // Scale up from default size
    con.font = `bold ${fontSize}px 'Microsoft YaHei', 'SimHei', Arial, sans-serif`
    con.textAlign = 'center'
    con.textBaseline = 'middle'
    
    // Add subtle animation effect for titles
    const Δy = effectStrength ? effectStrength * 10 * easeInOutQuad(oscillate(wrapAround(t))) : 0
    
    // Drop shadow for better visibility and theme enhancement
    con.shadowColor = '#000000'
    con.shadowBlur = 8
    con.shadowOffsetX = 2
    con.shadowOffsetY = 2
    
    // Render the text
    con.fillText(text, x0, y0 + Δy)
    
    con.restore()
}
