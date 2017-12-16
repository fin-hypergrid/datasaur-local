/* eslint-env browser */

'use strict';

var DataSourceBase = require('datasaur-base');

var getFieldNames = require('fin-hypergrid-field-tools').getFieldNames;


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
 * See {@link DataSourceOrigin#initialize} for constructor parameters.
 * @constructor
 */
var DataSourceLocal = DataSourceBase.extend('DataSourceLocal',  {

    initialize: function(data, schema) {
        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DataSourceLocal#
         */
        this.schema = [];

        this.setData(data, schema);
    },

    /**
     * Establish a new data and schema.
     * If no data provided, data will be set to 0 rows.
     * If no schema provided AND no previously set schema, new schema will be derived from data.
     * @param {object[]} [data=[]] - Array of uniform objects containing the grid data.
     * @param {columnSchemaObject[]} [schema=[]]
     * @memberOf DataSourceLocal#
     */
    setData: function(data, schema) {
        /**
         * @summary The array of uniform data objects.
         * @name data
         * @type {object[]}
         * @memberOf DataSourceLocal#
         */
        this.data = data || [];

        if (schema) {
            this.setSchema(schema);
        } else if (this.data.length && !this.schema.length) {
            this.setSchema([]);
        }
    },

    /**
     * @returns {columnSchemaObject[]}
     * @memberOf DataSourceLocal#
     */
    getSchema:  function(){
        return this.schema;
    },
    /**
     * Caveat: Do not call on a data update when you expect to reuse the existing schema.
     * @param schema
     * @memberOf DataSourceLocal#
     */
    setSchema: function(schema){
        if (!schema.length) {
            var dataRow = this.data.find(function(dataRow) { return dataRow; });

            schema = getFieldNames(dataRow).map(function(name) {
                return { name: name };
            });
        }

        this.schema = schema;
    },

    /**
     * @param y
     * @returns {dataRowObject}
     * @memberOf DataSourceLocal#
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
     * @memberOf DataSourceLocal#
     */
    setRow: function(y, dataRow) {
        this.data[y] = dataRow || undefined;
    },

    /**
     * Get metadata, a hash of cell properties objects.
     * Each cell that has properties (and only such cells) have a properties object herein, keyed by column schema name.
     * @param {number} y
     * @param {object} [newMetadata] - If row not found sets metadata to `newMetadata` if given.
     * @returns {undefined|object} Metadata object if row found with metadata; else `newMetadata` if given; else `undefined`.
     */
    getRowMetadata: function(y, newMetadata) {
        var dataRow = this.getRow(y);
        if (dataRow) {
            var metadata = dataRow.__META;
            if (metadata) {
                return metadata;
            } else if (newMetadata) {
                return (dataRow.__META = newMetadata);
            }
        }
    },

    /**
     * Set or clear metadata.
     * @param {number} y
     * @param {object} [metadata] - Hash of grid properties objects.
     * Each cell that has properties (and only such cells) have a properties object herein, keyed by column schema name.
     * If omitted, deletes properties object.
     * @returns {object|undefined} Returns `metadata` if row was found or `undefined` if not found (in which case call is a no-op).
     */
    setRowMetadata: function(y, metadata) {
        var dataRow = this.getRow(y);
        if (dataRow) {
            if (metadata) {
                dataRow.__META = metadata;
            } else {
                delete dataRow.__META;
            }
        }
        return dataRow && metadata;
    },

    /**
     * Insert or append a new row.
     *
     * _Note parameter order is the reverse of `setRow`._
     * @param {object} dataRow
     * @param {number} [y=Infinity] - The index of the new row. If `y` >= row count, row is appended to end; otherwise row is inserted at `y` and row indexes of all remaining rows are incremented.
     * @memberOf DataSourceLocal#
     */
    addRow: function(dataRow, y) {
        if (y === undefined || y >= this.getRowCount()) {
            this.data.push(dataRow);
        } else {
            this.data.splice(y, 0, dataRow);
        }
    },

    /**
     * Rows are removed entirely and no longer render.
     * Indexes of all remaining rows are decreased by `rowCount`.
     * @param {number} y
     * @param {number} [rowCount=1]
     * @returns {dataRowObject[]}
     * @memberOf DataSourceLocal#
     */
    delRow: function(y, rowCount) {
        if (rowCount === undefined) { rowCount = 1; }
        return this.data.splice(y, rowCount);
    },

    /**
     * @param {number} x
     * @param {number} y
     * @returns {*}
     * @memberOf DataSourceLocal#
     */
    getValue: function(x, y) {
        var row = this.getRow(y);
        if (!row) {
            return null;
        }
        return row[getColumnName.call(this, x)];
    },

    /**
     * @param {number} x
     * @param {number} y
     * @param value
     * @memberOf DataSourceLocal#
     */
    setValue: function(x, y, value) {
        this.getRow(y)[getColumnName.call(this, x)] = value;
    },

    /**
     * @returns {number}
     * @memberOf DataSourceLocal#
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @returns {number}
     * @memberOf DataSourceLocal#
     */
    getColumnCount: function() {
        return this.schema.length;
    }
});

function getColumnName(x) {
    return (typeof x)[0] === 'n' ? this.schema[x].name : x;
}


module.exports = DataSourceLocal;
