/* eslint-env browser */

'use strict';

var DataSourceBase = require('datasaur-base');

var getFieldNames = require('fin-hypergrid-field-tools').getFieldNames;


/**
 * See {@link DataSourceOrigin#initialize} for constructor parameters.
 * @constructor
 */
var DataSourceLocal = DataSourceBase.extend('DataSourceLocal',  {

    initialize: function(data, schema, options) {
        delete this.dataSource; // added by DataSourceBase#initialize but we don't want here

        this.treeColumnIndex = options.treeColumnIndex;
        this.rowColumnIndex = options.rowColumnIndex;

        this.schema = setInternalColSchema.call(this, []);

        this.setData(data, schema);
    },


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
         * @name schema
         * @type {columnSchemaObject[]}
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
     * @memberOf DataSourceLocal#
     * @returns {columnSchemaObject[]}
     */
    getSchema:  function(){
        return this.schema;
    },
    /**
     * @memberOf DataSourceLocal#
     * Caveat: Do not call on a data update when you expect to reuse the existing schema.
     * @param schema
     */
    setSchema: function(schema){
        if (!schema.length) {
            var fields = getFieldNames(this.data[0]);

            schema = Array(fields.length);

            for (var i = 0; i < fields.length; i++) {
                schema[i] = { name: fields[i] };
            }
        }

        /**
         * @summary The array of column schema objects.
         * @name schema
         * @type {columnSchemaObject[]}
         * @memberOf DataSourceLocal#
         */
        this.schema = setInternalColSchema.call(this, schema);
    },

    isNullObject: false,

    getDataIndex: function(y) {
        return y;
    },

    /**
     * @memberOf DataSourceLocal#
     * @param y
     * @returns {dataRowObject}
     */
    getRow: function(y) {
        return this.data[y];
    },

    addRow: function(dataRow) {
        this.data.push(dataRow);
    },

    delRow: function(y) {
        return this.data.splice(y, 1);
    },

    /**
     * @memberOf DataSourceLocal#
     * @param x
     * @param y
     * @returns {*}
     */
    getValue: function(x, y) {
        var row = this.getRow(y);
        if (!row) {
            return null;
        }
        return row[this.getColumnName(x)];
    },

    /**
     * @memberOf DataSourceLocal#
     * @param {number} x
     * @param {number} y
     * @param value
     */
    setValue: function(x, y, value) {
        this.getRow(y)[this.getColumnName(x)] = value;
    },

    getColumnName: function(x) {
        return (typeof x)[0] === 'n' ? this.schema[x].name : x;
    },

    /**
     * @memberOf DataSourceLocal#
     * @returns {number}
     */
    getRowCount: function() {
        return this.data.length;
    },

    /**
     * @memberOf DataSourceLocal#
     * @returns {number}
     */
    getColumnCount: function() {
        return this.schema.length;
    }
});

function setInternalColSchema(schema) {
    schema[this.treeColumnIndex] = schema[this.treeColumnIndex] || { name: 'Tree', header: 'Tree' };
    schema[this.rowColumnIndex] = schema[this.rowColumnIndex] || { name: '', header: '' };
    return schema;
}


module.exports = DataSourceLocal;
