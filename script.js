
const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");

const groupInput = document.getElementById("groupInput");
const addGroupButton = document.getElementById("addGroupButton");

const groupSelect = document.getElementById("groupSelect");
const dateInput = document.getElementById("dateInput");

const groupsContainer = document.getElementById("groupsContainer");

// Завантаження даних
let groups = JSON.parse(localStorage.getItem("todoGroups")) || [
    {
        id: 1,
        name: "Мої завдання"
    }
];

let tasks = JSON.parse(localStorage.getItem("todoTasks")) || [];

// --------------------
// LocalStorage
// --------------------

function saveData() {
    localStorage.setItem("todoGroups", JSON.stringify(groups));
    localStorage.setItem("todoTasks", JSON.stringify(tasks));
}

// --------------------
// Групи
// --------------------

function updateGroupSelect() {
    groupSelect.innerHTML = "";

    groups.forEach((group) => {
        const option = document.createElement("option");

        option.value = group.id;
        option.textContent = group.name;

        groupSelect.appendChild(option);
    });
}

function addGroup() {
    const name = groupInput.value.trim();

    if (name === "") {
        return;
    }

    const newGroup = {
        id: Date.now(),
        name: name
    };

    groups.push(newGroup);

    saveData();
    updateGroupSelect();
    renderTasks();

    groupInput.value = "";
    groupInput.focus();
}

function deleteGroup(groupId) {

    // Не дозволяємо видалити останню групу
    if (groups.length === 1) {
        alert("Потрібна хоча б одна група.");
        return;
    }

    const group = groups.find((item) => item.id === groupId);

    if (!group) {
        return;
    }

    const confirmed = confirm(
        `Видалити групу "${group.name}" та всі її завдання?`
    );

    if (!confirmed) {
        return;
    }

    groups = groups.filter((item) => item.id !== groupId);

    tasks = tasks.filter((task) => task.groupId !== groupId);

    saveData();
    updateGroupSelect();
    renderTasks();
}

// --------------------
// Відображення задач
// --------------------

function renderTasks() {

    groupsContainer.innerHTML = "";

    groups.forEach((group) => {

        const groupElement = document.createElement("div");
        groupElement.classList.add("group");

        // Заголовок групи
        const groupHeader = document.createElement("div");
        groupHeader.classList.add("group-header");

        const groupTitle = document.createElement("div");
        groupTitle.classList.add("group-title");
        groupTitle.textContent = group.name;

        const deleteGroupButton = document.createElement("button");
        deleteGroupButton.textContent = "Видалити групу";
        deleteGroupButton.classList.add("delete-group");

        deleteGroupButton.addEventListener("click", () => {
            deleteGroup(group.id);
        });

        groupHeader.appendChild(groupTitle);
        groupHeader.appendChild(deleteGroupButton);

        // Список задач
        const taskList = document.createElement("ul");
        taskList.classList.add("task-list");

        const groupTasks = tasks.filter(
            (task) => task.groupId === group.id
        );

        groupTasks.forEach((task) => {

            const li = document.createElement("li");
            li.classList.add("task");

            li.draggable = true;
            li.dataset.id = task.id;

            if (task.completed) {
                li.classList.add("completed");
            }

            // Контент задачі
            const content = document.createElement("div");
            content.classList.add("task-content");

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = task.completed;

            checkbox.addEventListener("change", () => {

                task.completed = checkbox.checked;

                saveData();
                renderTasks();
            });

            const taskInfo = document.createElement("div");
            taskInfo.classList.add("task-info");

            const text = document.createElement("span");
            text.classList.add("task-text");
            text.textContent = task.text;

            taskInfo.appendChild(text);

            // Дата
            if (task.date) {

                const date = document.createElement("span");
                date.classList.add("task-date");

                const formattedDate =
                    new Date(task.date + "T00:00:00")
                        .toLocaleDateString("uk-UA");

                date.textContent = `📅 ${formattedDate}`;

                taskInfo.appendChild(date);
            }

            content.appendChild(checkbox);
            content.appendChild(taskInfo);

            // Кнопка видалення
            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Видалити";
            deleteButton.classList.add("delete-button");

            deleteButton.addEventListener("click", () => {

                tasks = tasks.filter(
                    (item) => item.id !== task.id
                );

                saveData();
                renderTasks();
            });

            li.appendChild(content);
            li.appendChild(deleteButton);

            // --------------------
            // Drag & Drop
            // --------------------

            li.addEventListener("dragstart", () => {
                li.classList.add("dragging");
            });

            li.addEventListener("dragend", () => {

                li.classList.remove("dragging");

                updateTaskOrder(group.id);
            });

            taskList.appendChild(li);
        });

        // Переміщення задач
        taskList.addEventListener("dragover", (event) => {

            event.preventDefault();

            const draggingTask =
                taskList.querySelector(".dragging");

            if (!draggingTask) {
                return;
            }

            const taskElements = [
                ...taskList.querySelectorAll(
                    ".task:not(.dragging)"
                )
            ];

            let closestTask = null;
            let closestOffset = Number.NEGATIVE_INFINITY;

            taskElements.forEach((taskElement) => {

                const box =
                    taskElement.getBoundingClientRect();

                const offset =
                    event.clientY -
                    box.top -
                    box.height / 2;

                if (
                    offset < 0 &&
                    offset > closestOffset
                ) {
                    closestOffset = offset;
                    closestTask = taskElement;
                }
            });

            if (closestTask) {
                taskList.insertBefore(
                    draggingTask,
                    closestTask
                );
            } else {
                taskList.appendChild(draggingTask);
            }
        });

        groupElement.appendChild(groupHeader);
        groupElement.appendChild(taskList);

        groupsContainer.appendChild(groupElement);
    });
}

// --------------------
// Збереження нового порядку
// --------------------

function updateTaskOrder(groupId) {

    const groupElement = [...document.querySelectorAll(".group")]
        .find((element) => {

            const tasksInGroup =
                element.querySelectorAll(".task");

            return [...tasksInGroup].some(
                (task) => {

                    const id =
                        Number(task.dataset.id);

                    const originalTask =
                        tasks.find(
                            (item) => item.id === id
                        );

                    return originalTask?.groupId === groupId;
                }
            );
        });

    if (!groupElement) {
        return;
    }

    const taskElements =
        [...groupElement.querySelectorAll(".task")];

    const taskIds =
        taskElements.map(
            (element) => Number(element.dataset.id)
        );

    const otherTasks =
        tasks.filter(
            (task) => task.groupId !== groupId
        );

    const reorderedTasks =
        taskIds
            .map((id) =>
                tasks.find((task) => task.id === id)
            )
            .filter(Boolean);

    tasks = [
        ...otherTasks,
        ...reorderedTasks
    ];

    saveData();
}

// --------------------
// Додавання задачі
// --------------------

function addTask() {

    const text = taskInput.value.trim();

    if (text === "") {
        return;
    }

    const newTask = {

        id: Date.now(),

        text: text,

        completed: false,

        groupId: Number(groupSelect.value),

        date: dateInput.value || null
    };

    tasks.push(newTask);

    saveData();
    renderTasks();

    taskInput.value = "";
    dateInput.value = "";

    taskInput.focus();
}

// --------------------
// Події
// --------------------

addButton.addEventListener("click", addTask);

addGroupButton.addEventListener("click", addGroup);

taskInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        addTask();
    }
});

groupInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        addGroup();
    }
});

// --------------------
// Запуск
// --------------------

updateGroupSelect();
renderTasks();
