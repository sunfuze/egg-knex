--
-- PostgreSQL database dump
--

-- Dumped from database version 10.1
-- Dumped by pg_dump version 10.1

SET statement_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

CREATE SEQUENCE npm_auth_id_seq 
    START WITH 1 
    INCREMENT BY 1 
    NO MINVALUE 
    NO MAXVALUE 
    CACHE 1;

ALTER TABLE npm_auth_id_seq OWNER TO postgres;

CREATE TABLE npm_auth (
    id integer DEFAULT nextval('npm_auth_id_seq'::regclass) NOT NULL,
    user_id text,
    "desc" text,
    password text
);

ALTER TABLE npm_auth OWNER TO postgres;

ALTER TABLE ONLY npm_auth
    ADD CONSTRAINT npm_auth_pkey PRIMARY KEY (id);
