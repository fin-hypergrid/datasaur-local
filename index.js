/* eslint-env browser */

'use strict';

var DatasaurBase = require('datasaur-base');

/** @typedef {object} columnSchemaObject
 * @property {string} name - The required column name.
 * @property {string} [header] - An override for derived header
 * @property {function} [calculator] - A function for a computed column. Undefined for normal data columns.
 * @property {string} [type] - Used for sorting when and only when comparator not given.
 * @property {object} [comparator] - For sorting, both of following required:
 * @property {function} comparator.asc - ascending comparator
 * @property {function} comparator.desc - descending comparator
 */


/**
 * @param {object} [options]
 * @param {object[]} [options.data]
 * @param {object[]} [options.schema]
 * @constructor
 */
var DatasaurLocal = DatasaurBase.extend('DatasaurLocal',  {

    initialize: function(datasaur, options) {
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DatasaurLocal#
         */
        this.schema = [];

        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DatasaurLocal#
         */
        this.data = [];
    },

    /**
     * Establish new data and schema.
     * If no data provided, data will be set to 0 rows.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DatasaurLocal#
     */
    setData: function(data, schema) {
        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DatasaurLocal#
         */
        this.data = data || [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getSchema}
     * @memberOf DatasaurLocal#
     */
    getSchema:  function(){
        return this.schema;
    },
    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setSchema}
     * @memberOf DatasaurLocal#
     */
    setSchema: function(newSchema){
        if (!newSchema.length) {
            var dataRow = this.data.find(function(dataRow) { return dataRow; });
            if (dataRow) {
                newSchema = Object.keys(dataRow);
            }
        }

        this.schema = newSchema;
        this.dispatchEvent('fin-hypergrid-schema-changed');
    },

    /**
     * @param y
     * @returns {dataRowObject}
     * @memberOf DatasaurLocal#
     */
    getRow: function(y) {
        return this.data[y];
    },

    /**
     * Update or blank row in place.
     *
     * _Note parameter order is the reverse of `addRow`._
     * @param {number} y
     * @param {object} [dataRow] - if omitted or otherwise falsy, row renders as blank
     * @memberOf DatasaurLocal#
     */
    setRow: function(y, dataRow) {
        this.data[y] = dataRow || undefined;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowMetadata}
     * @memberOf DatasaurLocal#
     */
    getRowMetadata: function(y, prototype) {
        var dataRow = this.data[y];
        return dataRow && (dataRow.__META || (prototype !== undefined && (dataRow.__META = Object.create(prototype))));
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setRowMetadata}
     * @memberOf DatasaurLocal#
     */
    setRowMetadata: function(y, metadata) {
        var dataRow = this.data[y];
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return !!dataRow;
    },

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param {object} dataRow
     * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     * @memberOf DatasaurLocal#
     */
    addRow: function(dataRow, y) {
        if (y === undefined || y >= this.getRowCount()) {
            this.data.push(dataRow);
        } else {
            this.data.splice(y, 0, dataRow);
        }
        this.dispatchEvent('fin-hypergrid-data-shape-changed');
    },

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     * @param {number} y
     * @param {number} [rowCount=1]
     * @returns {dataRowObject[]}
     * @memberOf DatasaurLocal#
     */
    delRow: function(y, rowCount) {
        var rows = this.data.splice(y, rowCount === undefined ? 1 : rowCount);
        if (rows.length) {
            this.dispatchEvent('fin-hypergrid-data-shape-changed');
        }
        return rows;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getValue}
     * @memberOf DatasaurLocal#
     */
    getValue: function(x, y) {
        if (y===116 || y===114 && x===2) {
            var row = this.data[y];
            if (!row) {
                return null;
            }
            var key = getColumnName.call(this, x);
            var value = [
                row[key],
                this.data[y + 1][key],
                this.data[y + 2][key]
            ];
            value.subrows = true;
            ((row.__META || (row.__META = {})).__ROW || (row.__META.__ROW = {})).height = 46;

            if (!this.needsShapeChange) {
                // this needs to be "scheduled" because it's happening in middle of a grid render :(
                this.needsShapeChange = true;
                setTimeout(scheduleShapeChange.bind(this));
            }

            return value;
        } else {
            if (y>114) y +=2;
            if (y>116) y +=2;

            var row = this.data[y];
            if (!row) {
                return null;
            }
            return row[getColumnName.call(this, x)];
        }
    },
    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#setValue}
     * @memberOf DatasaurLocal#
     */
    setValue: function(x, y, value) {
        this.data[y][getColumnName.call(this, x)] = value;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getRowCount}
     * @memberOf DatasaurLocal#
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @see {@link https://fin-hypergrid.github.io/3.0.0/doc/dataModelAPI#getColumnCount}
     * @memberOf DatasaurLocal#
     */
    getColumnCount: function() {
        return this.schema.length;
    }
});

function getColumnName(x) {
    return (typeof x)[0] === 'n' ? this.schema[x].name : x;
}

function scheduleShapeChange() {
    this.needsShapeChange = false;
    this.dispatchEvent('data-shape-changed');
}

module.exports = DatasaurLocal;
