"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** find search customers. */

  static async search(searchQuery) {
    const [query1, query2] = searchQuery.split(" ");
    //TODO: Look at serach on solution to make a more flexible search query
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
          FROM customers
          WHERE
            first_name iLIKE '%'||$1||'%' OR
            first_name iLIKE '%'||$2||'%' OR
            last_name iLIKE '%'||$1||'%' OR
            last_name iLIKE '%'||$2||'%'
          ORDER BY last_name, first_name`,
          [`%${query1}%`, query2]
          //TODO: Have wild card in the array rather than in query
    );
    return results.rows.map(c => new Customer(c));
  }

  /** Get TOP 10 Customers by # of reservations. */
  //TODO: Rename to getTopTenCustomers to better match the query response
  static async getTopCustomers() {
    console.log("In getTopCustomers")
    debugger;
    const results = await db.query(
      `SELECT
        customers.id,
        customers.first_name AS "firstName",
        customers.last_name AS "lastName",
        customers.phone,
        customers.notes,
        COUNT(reservations.customer_id) AS "reservationCount"
      FROM reservations

      JOIN customers on
          reservations.customer_id = customers.id

      GROUP BY
          customers.id,
          customers.first_name,
          customers.last_name,
          customers.phone,
          customers.notes
      ORDER BY COUNT(reservations.customer_id) DESC
      LIMIT 10;`
    );
      //TODO: Could take out all the 78-81, not needed in postgreSQL but would
      //be needed in other db that are more strict

    return results.rows.map((c) =>
       new Customer({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        notes: c.notes
      })
    );
    //TODO: show # of reservations for each customer
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }

  /** get customer full name */
  //TODO: Could just return the string rather than named variable
  fullName() {
    const fullName = `${this.firstName} ${this.lastName}`;
    return fullName;
  }
}

module.exports = Customer;
