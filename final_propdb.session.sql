
SET sql_mode = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone ="+00:00";

create database final_propdb;
use final_propdb;
create table registration(
    userId int auto_increment primary key,
    username varchar(20) unique,
    email varchar(30) unique,
    password varchar(100),
    contact varchar (11),
    role enum ('system_admin', 'landlord', 'tenant')
);
create table lease_request(
    userId int auto_increment,
    first_name varchar(20) not null,
    surname varchar(20) not null,
    contact varchar(11) not null,
    address_1 varchar(20) not null,
    street varchar(20),
    address_2 varchar(20),
    line_1 varchar(20) not null,
    line_2 varchar(20),
    home_phone varchar(20),
    postal_code varchar(20) primary key,
    property varchar(20) not null,
    number_of_units int not null,
    foreign key (userId) references registration (userId)
);
CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    PropertyName VARCHAR(255),
    Type VARCHAR(255),
    Location VARCHAR(255),
    Description TEXT,
    Number_Of_Bedrooms INT,
    Number_Of_Bathrooms INT,
    Cost DECIMAL(10, 2),
    Dateadded timestamp,
    Image VARCHAR(255),
    imageFilename varchar(50)
);
select *
from properties;
CREATE TABLE PropertyFeedback (
    PropertyFeedBackId INT AUTO_INCREMENT PRIMARY KEY,
    PropertyName varchar,
    comments TEXT,
    likes INT,
    dislikes INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
select *
from registration;
drop table lease_request;
desc registration;