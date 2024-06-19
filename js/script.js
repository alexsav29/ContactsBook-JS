class User {
    constructor(data) {
        this.data = data;
    };

    edit(newUserData) {
        this.data = {
            ...this.data,
            ...newUserData
        };
    };

    get() {
        return this.data;
    };
};


class Contacts {
    constructor() {
        this.data = this.localStorageMapHandler() ?? [];

        this.clearLocalStorage();
    };

    add(userData) {
        this.data.push(new User(userData));
        this.setLocalStorage();
    };

    edit(id, userObject) {
        this.data = this.data.map((user) => {
            const { data: { id: userId } } = user;
            if (userId === id) {
                user.edit(userObject);
            };
            return user;
        });
        this.setLocalStorage();
    };

    remove(id) {
        this.data = this.data.filter(({ data: { id: userId } }) => userId !== id);
        this.setLocalStorage();
    };

    getContacts() {
        return this.data;
    };

    setLocalStorage() {
        localStorage.setItem('contacts', JSON.stringify(this.data));
        this.setCookie();
    };

    getLocalStorage() {
        return localStorage.getItem('contacts');
    };

    localStorageMapHandler() {
        let localStorageArray = JSON.parse(localStorage.getItem('contacts'));

        if (localStorageArray) {
            return localStorageArray.map(({ data }) => new User(data));
        };
        return undefined;
    };

    clearLocalStorage() {
        if (!this.getCookie('storageExpiration')) {
            localStorage.removeItem('contacts');
        };
    };


    setCookie() {
        // const days = 10 * 24 * 60 * 60;  // 10 дней
        const days = 10; // 10 секунд
        document.cookie = `storageExpiration=true; max-age=${days}`;

        if (this.getCookie('storageExpiration') !== 'true') {
            this.clearLocalStorage();
        };

    };

    getCookie(name) {
        let matches = document.cookie.match(new RegExp(
            "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
        ));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    };
};


class ContactsApp extends Contacts {
    constructor() {
        super();

        this.app = this.render();
        document.body.appendChild(this.app);

        this.onAdd();
        this.renderContactsItems();

        this.initGetFetchData();
    };

    initGetFetchData() {
        if (!this.getLocalStorage()) {
            this.getFetchData();
        };
    };

    async getFetchData() {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        const data = await response.json();

        this.fetchDataMapper(data);

    };

    fetchDataMapper(data) {
        data.forEach((user) => {
            const { id, name, email, address: { city, street, suite }, phone } = user;

            const fetchUser = {
                id: `${id}`,
                name,
                email,
                address: `${city}, ${street}, ${suite}`,
                phone
            };

            this.add(fetchUser);
        });
    };


    render() {
        const contacts = document.createElement('div');
        contacts.classList.add('contacts');
        contacts.innerHTML = `
                                <div class="contacts__wrapper">
                                    <div class="contacts__header">
                                        <h2 class="contacts__header__title">Contacts Book</h2>
                                        <div class="contacts__form__input">
                                            <input type="text" class="input__name" placeholder="Name" />
                                            <input type="email" class="input__email" placeholder="Email" />
                                            <input type="text" class="input__address" placeholder="Address" />
                                            <input type="tel" class="input__phone" placeholder="Phone" />
                                        </div>
                                        <div class="header__btn__container">
                                            <button class="add__contact__btn btn">Add contact</button>
                                            <button class="remove__contacts__btn btn">Remove All contacts</button>
                                        </div>
                                    </div>
                                    <div class="contacts__body"></div>
                                </div>
                             `;
        return contacts;
    };

    onAdd() {
        const addContactBtn = document.querySelector('.add__contact__btn');
        addContactBtn.addEventListener('click', () => {
            let name = document.querySelector('.input__name').value;
            let email = document.querySelector('.input__email').value;
            let address = document.querySelector('.input__address').value;
            let phone = document.querySelector('.input__phone').value;

            if (!name || !email || !address || !phone) {
                return;
            };

            const newUserData = {
                id: `${new Date().getTime()}`,
                name,
                email,
                address,
                phone
            };

            this.add(newUserData);

            document.querySelector('.input__name').value = '';
            document.querySelector('.input__email').value = '';
            document.querySelector('.input__address').value = '';
            document.querySelector('.input__phone').value = '';

            this.renderContactsItems();
        });
    };

    renderContactsItems() {
        const contactsContainer = document.createElement('ul');
        contactsContainer.classList.add('contacts__container');

        let listContacts = '';
        const contactsArray = this.getContacts();
        contactsArray.forEach((user) => {
            const { data: { id, name, email, address, phone } } = user;

            listContacts += `
                                        <li class="contact__item">
                                            <div class="contact__item__content">
                                                <p class="contact__name">Name: ${name}</p>
                                                <p class="contact__email">Email: ${email}</p>
                                                <p class="contact__address">Address: ${address}</p>
                                                <p class="contact__phone">Phone: ${phone}</p>
                                            </div>
                                            <div class="remove__edit__btns">
                                                <button class="remove__btn btn" id="${id}">Remove</button>
                                                <button class="edit__btn btn" data-edit="${id}">Edit</button>
                                            </div>
                                        </li>
                                      `;
        });

        contactsContainer.innerHTML = listContacts;
        const contactsBody = document.querySelector('.contacts__body');
        contactsBody.innerHTML = '';
        contactsBody.appendChild(contactsContainer);

        this.onRemove();
        this.onEdit();
    };


    onRemove() {
        const removeBtns = document.querySelectorAll('.remove__btn');
        removeBtns.forEach((removeBtn) => {
            removeBtn.addEventListener('click', (event) => {
                const contactId = event.target.id;
                if (contactId === removeBtn.id) {
                    this.remove(contactId);
                };
                this.renderContactsItems();
            });
        });

        const removeAllBtn = document.querySelector('.remove__contacts__btn');
        removeAllBtn.addEventListener('click', () => {
            this.data = [];
            localStorage.removeItem('contacts');
            this.renderContactsItems();
        });
    };

    onEdit() {
        const editBtns = document.querySelectorAll('.edit__btn');
        editBtns.forEach((editBtn) => {
            editBtn.addEventListener('click', (event) => {
                const contactId = event.target.dataset.edit;
                const editBtnId = editBtn.dataset.edit;
                if (contactId === editBtnId) {
                    const editContact = this.data.find((contact) => contactId === contact.data.id);

                    this.addModal(editContact);
                    this.cancelEdit();
                    this.saveEdit();

                };
            });
        });
    };

    saveEdit() {

        const saveEditBtn = document.querySelector('.modal__save__btn');
        saveEditBtn.addEventListener('click', (event) => {
            const name = document.querySelector('.modal__input__name').value;
            const email = document.querySelector('.modal__input__email').value;
            const address = document.querySelector('.modal__input__address').value;
            const phone = document.querySelector('.modal__input__phone').value;

            const contactId = event.target.dataset.save;

            const newContactData = {
                name,
                email,
                address,
                phone
            };

            this.edit(contactId, newContactData);

            this.removeModalWindow();

            this.renderContactsItems();
        });
    };

    cancelEdit() {
        const cancelEdit = document.querySelector('.modal');
        cancelEdit.addEventListener('click', (event) => {
            if (event.target.className === 'modal__cancel__btn btn' || event.target.className === 'modal') {
                this.removeModalWindow();
            };
        });
    };

    removeModalWindow() {
        document.querySelector('.modal').remove();
    }

    createEditModalWindow(editContact) {
        const { data: { id, name, email, address, phone } } = editContact;
        const modal = document.createElement('div');
        modal.classList.add('modal');


        modal.innerHTML = `
                            <div class="modal__wrapper">
                                <div class="modal__container">
                                    <h3 class="modal__title">Contact Editor</h3>
                                    <div class="modal__edit__content">
                                        <p class="modal__name__label">Name: <input type="text" class="modal__input__name" value="${name}" /><p>
                                        <p class="modal__email__label">Email: <input type="email" class="modal__input__email" value="${email}" /><p>
                                        <p class="modal__address__label">Address: <input type="text" class="modal__input__address" value="${address}" /><p>
                                        <p class="modal__phone__label">Phone: <input type="tel" class="modal__input__phone" value="${phone}" /><p>
                                    </div>
                                    <div class="modal__btns">
                                        <button class="modal__cancel__btn btn">Cancel</button>
                                        <button class="modal__save__btn btn" data-save="${id}">Save</button>
                                    </div>
                                </div>
                            </div>
                          `;
        return modal;
    };

    addModal(editContact) {
        this.modal = this.createEditModalWindow(editContact);
        document.body.appendChild(this.modal);
    };

};


const contactsApp = new ContactsApp();