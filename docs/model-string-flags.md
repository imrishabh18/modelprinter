# Model string flags

Geometry choices use value-free flags and boolean properties. For example,
`plainbushing_id8mm_od12mm_l20mm_plainclosed` resolves `plainClosed: true`,
`tslotextrusion_w20mm_h20mm_l100mm_fourtsolid_slot6mm_pocket10mm_pocketd2mm_lip2mm_bore4mm_corner1mm`
resolves `fourTSolid: true`, and `hexbolt_m4_l20mm_hex_fullthread_lefthanded`
resolves `hex: true`, `fullThread: true`, and `leftHanded: true`.

Flags belong to each model's parser. A flag takes no value; duplicate flags,
conflicting alternatives, unsupported flags and old enum-style selectors are
rejected. Supported default geometry is selected when its flag is omitted.
Single supported features have true boolean defaults; handedness is expressed
as a boolean instead of a string. Schemas reject obsolete selector properties
and preserve validation for unsupported geometry.

Size designations, thread classes, numeric dimensions, and coordinate tuples
retain their named values. Every parsed model remains suitable for a schema
roundtrip and for React and vanilla renderer routing.
