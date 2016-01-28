
## log.format(value, options)

Print any value with pretty formatting.

Use the `options` object to customize the output!

## options

#### • label

A `String` that is printed before the formatted value.

#### • maxObjectKeys

A `Number` specifying how many keys per `Object` should be printed before truncation is applied.

#### • maxArrayKeys

A `Number` specifying how many items per `Array` should be printed before truncation is applied.

#### • maxObjectDepth

A `Number` specifying how deep into a series of nested objects should the printer travel before collapsing any `Object` properties it comes across.

#### • collapse

A `Function` used as a filter to determine if an `Object` should prints its properties (or not).

Alternatively, this can be a `Boolean` if you want to collapse all objects.

#### • keyOffset

A `Number` specifying how many keys to skip when printing an `Array` or `Object`.

This is useful when `maxObjectKeys` or `maxArrayKeys` is set and you want to see further down the list.

#### • showInherited

A `Boolean` that (when equal to `true`) prints the inherited properties of objects.

## default values

You can even change the default values for option keys.

Currently available default values include:

- **maxObjectDepth** = 2

- **maxObjectKeys** = 30

- **maxArrayKeys** = 10

- **keyOffset** = 0

- **showInherited** = yes

Here's how to change their values:

```CoffeeScript
log.format.maxObjectDepth = 5
```
